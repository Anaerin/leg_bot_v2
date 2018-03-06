"use strict";
const Twitch = require("../lib/Twitch.js");
const DB = require("../db");
const log = require("../lib/log.js");

class AuthHandler {
	constructor() {
	}
	static isAuthenticated(session) {
		return new Promise((resolve, reject) => {
			if (!session.loggedIn) {
				reject({ login: true });
			} else {
				Twitch.getTokenDetails(session.user.accessToken).then((token) => {
					if (!token.valid) {
						Twitch.refreshToken(session.user.refreshToken).then((token) => {
							if (token.error) {
								session.regenerate((err) => {
									if (err) {
										log.warn("Unable to regenerate session following refresh failure");
										reject({ error: "Session Regeneration failure" });
									} else {
										reject({ login: true });
									}									
								});
							} else {
								session.user.accessToken = token["access_token"];
								session.user.refreshToken = token["refresh_token"];
								if (token["expires_in"]) {
									session.user.tokenExpiry = Date.now() + (token["expires_in"] * 1000);
								} else {
									session.user.tokenExpiry = Date.now() + 3600000;
								}
								session.user.scopes = token["scope"];
								session.user.save().then(() => {
									resolve();
								});
							}
						});
					} else {
						resolve();
					}
				});
			}
		});
	}
	static AcceptToken(req, res) {
		Twitch.completeToken(req.query.code, req.query.state, req.session.nonce).then((response) => {
			if (response.valid) {
				req.session.token = response.token;
				req.session.loggedIn = true;
				req.session.userName = response.token.userName;
				req.session.userID = response.token.userID;
				log.info("Got valid Token response, looking up user info");
				DB.models.User.getUserByID(req.session.userID).catch((err) => {
					//res.status(500);
					res.render("main", {
						title: "Error",
						content: "An error occurred fetching user details - <pre>" + JSON.stringify(err) + "</pre>"
					});
				}).then((user) => {
					req.session.displayName = user.displayName;
					req.session.logo = user.profileImageURL;
					user.accessToken = response["access_token"];
					user.refreshToken = response["refresh_token"];
					user.tokenExpiry = Date.now() + (parseInt(response["expires_in"]) * 1000);
					user.scopes = response.scopes;
					user.save();
					req.session.user = user;
				});
			} else {
				//res.status(500);
				res.render("main", {
					title: "Error",
					content: "An error occurred - oAuth Token is invalid. Please inform Anaerin."
				});
			}
		}).catch((err) => {
			//res.status(500);
			res.render("main", {
				title: "Error",
				content: "An error occurred - oAuth Token is invalid. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	}
}

module.exports = AuthHandler;