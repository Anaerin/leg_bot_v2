"use strict";
const Twitch = require("../lib/Twitch.js");
const log = require("../lib/log.js");

class AuthHandler {
	static async isAuthenticated(session) {
		if (!session.loggedIn) {
			throw {
				login: true
			};
		} else {
			let token = await Twitch.getTokenDetails(session.user.accessToken);
			if (!token.valid) {
				token = await Twitch.refreshToken(session.user.refreshToken);
				if (token.error) {
					session.regenerate((err) => {
						if (err) {
							log.warn("Unable to regenerate session following refresh failure");
							throw {
								error: "Session Regeneration failure"
							};
						} else {
							throw {
								login: true
							};
						}
					});
				}
			}
			if (token.valid) {
				session.user.accessToken = token["access_token"];
				session.user.refreshToken = token["refresh_token"];
				if (token["expires_in"]) {
					session.user.tokenExpiry = Date.now() + (token["expires_in"] * 1000);
				} else {
					session.user.tokenExpiry = Date.now() + 3600000;
				}
				session.user.scopes = token["scope"];
				token = await session.user.save();
				return;
			} else {
				log.warn("Something went wrong with getting or refreshing the token. We should never get here.");
				throw {
					error: "Get/Refresh error"
				};
			}
		}

	}
	static async AcceptToken(req, res) {
		try {
			let response = await Twitch.completeToken(req.query.code, req.query.state, req.session.nonce);
			if (response.valid) {
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
				user.tokenExpiry = Date.now() + (parseInt(response["expires_in"]) * 1000);
				user.scope = response.scope;
				user.save();
				req.session.user = user;
			} else {
				throw "oAuth token is invalid";
			}
		} catch (err) {
			//res.status(500);
			res.render("main", {
				title: "Error",
				content: "An error occurred - oAuth Token is invalid. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		}
	}
}
module.exports = AuthHandler;