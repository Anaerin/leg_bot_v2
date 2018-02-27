"use strict";
const Twitch = require("../../lib/Twitch.js");
const log = require("../../lib/log.js");
const express = require("express");
const DB = require("../../db");

let app = module.exports = new express.Router({ mergeParams: true });

app.get("/$", (req, res) => {
	let twitchAuth = req.query.code;
	let twitchState = req.query.state;
	let twitchNonce = req.session.nonce;
	if (req.session.state === req.query.state) {
		Twitch.completeToken(twitchAuth, twitchState, twitchNonce).then((response) => {
			if (response.valid) {
				req.session.token = response.token;
				req.session.loggedIn = true;
				req.session.userName = response.token.userName;
				req.session.userID = response.token.userID;
				log.info("Got valid Token response, looking up user info");
				DB.models.User.getUserByID(req.session.userID).catch((err) => {
					res.status(500);
					res.render("main", {
						title: "Error",
						content: "An error occurred fetching user details - <pre>" + JSON.stringify(err) + "</pre>"
					});
				}).then((user) => {
					req.session.displayName = user.displayName;
					req.session.logo = user.profileImageURL;
					user.token = response.token;
					user.scopes = response.scopes;
					user.save();
				});
			} else {
				res.status(500);
				res.render("main", {
					title: "Error",
					content: "An error occurred - oAuth Token is invalid. Please inform Anaerin."
				});
			}
		}).catch((err) => {
			res.status(500);
			res.render("main", {
				title: "Error",
				content: "An error occurred - oAuth Token is invalid. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	} else if (req.query.state === "TMILogin") {
		Twitch.completeToken(twitchAuth, twitchState).then((token, valid) => {
			if (valid) { 
				res.redirect("/"); 
			} else {
				res.render("main", {
					title: "Error",
					content: "An error occurred hile logging in. Please inform Anaerin\n<pre>Token `" + token + "` not valid"
				});
			}
		}).catch((err) => {
			res.render("main", {
				title: "Error",
				content: "An error occurred while logging in. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	} else {
		//This token is for someone else?
		log.warn("Got token for %s, but session ID is for %s... Mismatch?", req.query.state, req.session.id);
		res.redirect("/");
	}
});
