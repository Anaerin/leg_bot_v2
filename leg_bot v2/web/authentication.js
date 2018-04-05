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
				session.user.save();
				return;
			} else {
				log.warn("Something went wrong with getting or refreshing the token. We should never get here.");
				throw {
					error: "Get/Refresh error"
				};
			}
		}

	}
}
module.exports = AuthHandler;