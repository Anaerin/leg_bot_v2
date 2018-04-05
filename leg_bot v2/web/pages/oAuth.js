"use strict";
const Twitch = require("../../lib/Twitch.js");
const express = require("express");
const log = require("../../lib/log.js");
let app = module.exports = new express.Router({
	mergeParams: true
});

app.get("/$", async (req, res) => {
	if (req.session.state === req.query.state) {
		log.debug("Got Token with matching state. Accepting...");
		try {
			let response = await Twitch.completeToken(req.query.code, req.query.state, req.session.nonce);
			if (response.valid) {
				//let [token, accessToken, refreshToken, expiresIn, scope] = await Auth.AcceptToken();
				req.session.token = response.token;
				req.session.loggedIn = true;
				req.session.userName = response.token.userName;
				req.session.userID = response.token.userID;
				log.info("Got valid Token response, looking up user info");
				let user = await Twitch.getUserByID(req.session.userID);
				req.session.displayName = user.displayName;
				req.session.logo = user.profileImageURL;
				user.accessToken = response["access_token"];
				user.refreshToken = response["refresh_token"];
				if (response["expires_in"]) {
					user.tokenExpiry = Date.now() + (parseInt(response["expires_in"]) * 1000);
				} else {
					user.tokenExpiry = Date.now() + (3600 * 1000);
				}
				user.scope = response.scope;
				user.save();
				req.session.user = user;
				log.debug("User logged in. Redirecting to %s, or // if undefined.", req.session.returnURL);
				req.session.save((err) => {
					if (err) {
						res.render("main", {
							title: "Error",
							content: "An error occurred while saving the session"
						});
					} else {
						if (req.session.returnURL) res.redirect(req.session.returnURL);
						else res.redirect("/");
					}
				});
			} else throw "oAuth Token is not valid";
		} catch (e) {
			res.render("main", {
				title: "Error",
				content: "An error occurred while logging in. Please inform Anaerin\n<pre>" + e + "</pre>"
			});
		}
	} else if (req.query.state === "TMILogin") {
		try {
			let [token, valid] = await Twitch.completeToken(req.query.code, req.query.state);
			if (valid) {
				res.redirect("/");
			} else {
				throw "Token " + token + " not valid";
			}
		} catch (err) {
			res.render("main", {
				title: "Error",
				content: "An error occurred while logging in. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		}
	}
});