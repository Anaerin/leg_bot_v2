"use strict";
/*
Node doesn't support ES6 imports.
import api from 'tmi.js';
import Settings from '../lib/settings.js';
import Secrets from '../secrets.js';
import EventEmitter from 'events';
import log from './log.js';
*/

//const tmi = require("tmi.js");
//const client = new tmi.client();
const Request = require("request");
//const api = client.api;
const api = Request;
const Settings = require("./settings.js");
const Secrets = require("../secrets.js");
const EventEmitter = require("events");
const log = require("./log.js");
const jwt = require("jsonwebtoken");
const DB = require("../db");
/* Welcome to the Twitch class.
 * This fun little class will attempt to authenticate a token with Twitch
 * So we can connect with tmi.
 * It will also verify other tokens, so we can handle users logging in in one place.
 * And it contains an implementation for most Twitch API calls as a single function. */

class TwitchAPI extends EventEmitter {
	
	// Build the object, including it's event emitter.
	constructor() {
		super();
		log.info("Constructing TwitchAPI");
		this.clientID = Secrets.clientID;
		this.redirectURL = Secrets.redirectURL;
		this.scopes = ["user_read", "user_follows_edit", "chat_login"];
		this.tokenIsValid = false;
		this.baseRequest = {
			method: "get",
			json: true,
			headers: {
				"Client-ID": this.clientID,
				"Accept": "application/vnd.twitchtv.v5+json"
			}
		};
		this.baseRequestNewAPI = {
			method: "get",
			json: true,
			headers: {
				"Client-ID": this.clientID
			}
		};
		this.twitchResponseMapping = {
			"broadcaster_type": "broadcasterType",
			description: "description",
			"display_name": "displayName",
			"id": "userID",
			"login": "userName",
			"offline_image_url": "offlineImageURL",
			"profile_image_url": "profileImageURL",
			type: "type",
			"view_count": "viewCount"
		};
		// If the settings are loaded, load the token details.
		// Otherwise, defer loading until the settings object says it's ready.
		this.tryLoadToken();		
	}
	
	// Keep trying to load the token from settings.
	tryLoadToken() {
		log.info("Trying to load token");
		if (Settings._loaded) {
			this.loadToken();
		} else {
			setTimeout(() => {
				this.tryLoadToken();
			}, 1000);
		}	
	}

	// Load the token, if it's valid, or prompt for auth.
	loadToken() {
		if (Settings.oAuthToken) {
			this.userName = Settings.userName;
			this.oAuthToken = Settings.oAuthToken;
			this.getMyTokenDetails(this.oAuthToken);
		} else {
			this.promptForToken();
		}
	}

	// Call the twitch API to get the details of the token we have. Need username for logging in, for instance.
	// If we don't have a valid token, prompt to get us one.
	getMyTokenDetails(token) {
		this.tokenIsValid = false;
		this.getTokenDetails(token).then((response) => {
			log.debug("TokenDetails contains", response);
			this.tokenIsValid = true;
			for (let scope of this.scopes) {
				if (!response.scopes.includes(scope)) {
					this.tokenIsValid = false;
					log.error("Missing scope %s", scope);
				}
			}
			if (this.tokenIsValid) {
				this.userName = response.userName;
				this.userID = response.userID;
				this.oAuthToken = token;
				Settings.userName = this.userName;
				Settings.userID = this.userID;
				Settings.oAuthToken = this.oAuthToken;
				this.emit("GotValidToken", { token: this.oAuthToken, userName: this.userName, userID: this.userID });
			}
		}, (error) => {
			log.error(error);
		});
		
	}
	
	processAPIRequest(request, resolve, reject) {
		api(request, (err, res, body) => {
			if (err) reject(err);
			if (body) resolve(body);
		});
	}
	getFromNewAPI(path, querystring = {}) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequestNewAPI;
			request.url = this.NewAPIURLMaker(path, querystring);
			this.processAPIRequest(request, resolve, reject);
		});
	}
	/* getUserByID(userID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["users", userID]);
			this.processAPIRequest(request, resolve, reject);
		});
	} */
	getUserByID(userID) {
		return DB.models.User.findOrCreate({where: { userID: userID }, defaults: { userID: userID }}).spread((foundUsers, created) => {
			let user;
			if (Array.isArray(foundUsers)) user=foundUsers[0];
			else user = foundUsers;
			if (created || Date.parse(user.lastQueried) < (Date.now() - 43200000) ) {
				return this.getFromNewAPI(["users"],{id: userID}).then((userData) => {
					let twitchUser = userData.data[0];
					if (user.userName && user.userName != twitchUser.login) {
						DB.models.UserHistory.create({
							userID: twitchUser.id,
							timeChanged: Date.now(),
							oldUserName: twitchUser.login
						}).then((createdHistory) => {
							user.addUserHistory(createdHistory);
						});
					}
					for (let response in this.twitchResponseMapping) {
						user[this.twitchResponseMapping[response]] = twitchUser[response];
					}
					user.lastQueried = Date.now();
					return user.save();
				});
			} else {
				return user;
			}
		});
	}

	/* getUserByName(username) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["users"], {login: username});
			this.processAPIRequest(request, resolve, reject);
		});
	} */

	getUserByName(userName) {
		return DB.models.User.findOrCreate({where: { userName: userName }, defaults: { userName: userName }}).spread((foundUsers, created) => {
			let user;
			if (Array.isArray(foundUsers)) user=foundUsers[0];
			else user = foundUsers;
			if (created || Date.parse(user.lastQueried) < (Date.now() - 43200000) ) {
				return this.getFromNewAPI(["users"],{login: userName}).then((userData) => {
					let twitchUser = userData.data[0];
					for (let response in this.twitchResponseMapping) {
						user[this.twitchResponseMapping[response]] = twitchUser[response];
					}
					user.lastQueried = Date.now();
					return user.save();
				});
			} else {
				return user;
			}
		});
	}

	getTokenDetails(token) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker([""]);
			request.headers.Authorization = "OAuth " + token;
			log.info("Requesting token details", request);
			api(request, (err, res, body) => {
				if (err) { reject(err); }
				log.debug("Got the following token", JSON.stringify(body));
				if (body && body.token && body.token.valid) {
					if (body.token.authorization) {
						resolve({
							token: token,
							userName: body.token.user_name,
							userID: body.token.user_id,
							scopes: body.token.authorization.scopes
						});
					} else {
						resolve({
							token: token,
							userName: body.token.user_name,
							userID: body.token.user_id,
						});
					}
				} else {
					reject(body);
				}
			});
		});
	}
	
	getChannel(token) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["channel"]);
			request.headers.Authorization = "OAuth " + token;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelById(ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	updateChannel(token, ChannelID, status, game, delay, channel_feed_enabled) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.method = "PUT";
			let qs = {};
			if (status) qs.status = status;
			if (game) qs.game = game;
			if (delay) qs.delay = delay;
			if (channel_feed_enabled !== "undefined" && channel_feed_enabled !== "null") qs.channel_feed_enabled = channel_feed_enabled;
			request.url = this.URLMaker(["channels", ChannelID]);
			request.form = qs;
			request.headers.Authorization = "OAuth " + token;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelEditors(token, ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID, "editors"]);
			request.headers.Authorization = "OAuth " + token;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelFollowers(ChannelID, cursor) {
		return new Promise((resolve, reject) => {
			let qs = { limit: 100 };
			if (cursor) qs.cursor = cursor;
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID, "follows"], qs);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelTeams(ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID, "teams"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelSubscribers(token, ChannelID, page) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			let qs = { limit: 100 };
			if (page) qs.offset = page * 100;
			request.url = this.URLMaker(["channels", ChannelID, "subscriptions"], qs);
			request.headers.Authorization = "OAuth " + token;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	checkChannelSubscriptionForUser(token, ChannelID, UserID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID, "subscriptions", UserID]);
			request.headers.Authorization = "OAuth " + token;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelVideos(ChannelID, page, broadcast_type, language) {
		return new Promise((resolve, reject) => {
			let qs = { limit: 100 };
			if (Array.isArray(broadcast_type)) qs.broadcast_type = broadcast_type.join(",");
			if (typeof broadcast_type === "string") qs.broadcast_type = broadcast_type;
			if (Array.isArray(language)) qs.language = language.join(",");
			if (typeof language === "string") qs.language = language;
			if (page) qs.offset = page * 100;
			let request = this.baseRequest;
			request.url = this.URLMaker(["channels", ChannelID, "videos"], qs);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	startChannelCommercial(token, ChannelID, duration) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.method = "POST";
			request.headers.Authorization = "OAuth " + token;
			request.url = this.URLMaker(["channels", ChannelID, "commercial"]);
			request.body = duration;
			this.processAPIRequest(request, resolve, reject);
		});
	}

	resetStreamKey(token, ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.method = "DELETE";
			request.headers.Authorization = "OAuth " + token;
			request.url = this.URLMaker(["channels", ChannelID, "stream_key"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChannelCommunity(token, ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.headers.Authorization = "OAuth " + token;
			request.url = this.URLMaker(["channels", ChannelID, "community"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	setChannelCommunity(token, ChannelID, CommunityID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.headers.Authorization = "OAuth " + token;
			request.url = this.URLMaker(["channels", ChannelID, "community", CommunityID]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	removeChannelFromCommunity(token, ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.method = "DELETE";
			request.headers.Authorization = "OAuth " + token;
			request.url = this.URLMaker(["channels", ChannelID, "community"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChatBadgesByChannel(ChannelID) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["chat", ChannelID, "badges"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getChatEmoticonsBySet(emoteset) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			let qs = {};
			if (emoteset) qs.emoteset = emoteset;
			request.url = this.URLMaker(["chat", "emoticon_images"], qs);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getAllChatEmoticons() {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["chat", "emoticons"]);
			this.processAPIRequest(request, resolve, reject);
		});
	}
	
	getClip(slug) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			request.url = this.URLMaker(["clips", slug]);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getTopClips(channelNames,games,languages,period,trending,cursor) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			let qs = { limit: 100 };
			if (Array.isArray(channelNames)) qs.channel = channelNames.join(",");
			if (typeof channelNames === "string") qs.channel = channelNames;
			if (Array.isArray(games)) qs.game = games.join(",");
			if (typeof games === "string") qs.game = games;
			if (Array.isArray(languages)) qs.language = languages.join(",");
			if (typeof languages === "string") qs.language = languages;
			if (typeof trending !== "undefined") qs.trending = trending;
			switch (period) {
				case "day":
				case "week":
				case "month":
				case "all":
					qs.period = period;
					break;
			}
			if (cursor) qs.cursor = cursor;
			request.url = this.URLMaker(["clips", "top"], qs);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	getFollowedClips(token, cursor, trending) {
		return new Promise((resolve, reject) => {
			let request = this.baseRequest;
			let qs = {};
			request.headers.Authorization = "OAuth " + token;
			if (cursor) qs.cursor = cursor;
			if (typeof trending !== "undefined") qs.trending = trending;
			request.url = this.URLMaker(["clips", "followed"], qs);
			this.processAPIRequest(request, resolve, reject);
		});
	}

	NewAPIURLMaker(endpoint, querystring = {}) {
		let URL = "https://api.twitch.tv/helix/" + endpoint.join("/");
		if (Object.getOwnPropertyNames(querystring).length > 0) {
			URL += "?";
			let args = [];
			for (let name in querystring) {
				args.push(name + "=" + encodeURIComponent(querystring[name]));
			}
			URL += args.join("&");
		}
		return URL;
	}

	URLMaker(endpoint, querystring = {}) {
		let URL = "https://api.twitch.tv/kraken/" + endpoint.join("/");
		if (Object.getOwnPropertyNames(querystring).length > 0) {
			URL += "?";
			let args = [];
			for (let name in querystring) {
				args.push(name + "=" + encodeURIComponent(querystring[name]));
			}
			URL += args.join("&");
		}
		return URL;
	}

	verifyTwitchJWT(token) {
		return new Promise((resolve, reject) => {
			this.getOIDCKeys().then((keys) => {
				let key = keys[0];
				let options = {
					algorithms: [key.alg],
					issuer: "Twitch"
				};
				jwt.verify(token, key.n, options, (err, decoded) => {
					if (err) reject(err);
					if (decoded) resolve(decoded);
				});
			});
		});
	}

	getOIDCKeys() {
		return new Promise((resolve, reject) => {
			if (this.OIDCKeys) resolve(this.OIDCKeys);
			let request = {
				json: true,
				method: "get",
				url: "https://api.twitch.tv/api/oidc/keys"
			};
			api(request, (err, res, body) => {
				if (err) reject(err);
				if (body) {
					this.OIDCKeys = body;
					resolve(body);
				}
			});
		});
	}

	tokenURL(scopes, state, nonce) {
		if (scopes === "") scopes = [];
		let qs = {
			response_type: "code",
			client_id: this.clientID,
			redirect_uri: this.redirectURL,
			scope: scopes.join(" "),
		};
		if (state) qs.state = state;
		if (nonce) qs.nonce = nonce;
		return this.URLMaker(["oauth2","authorize"], qs);
		/* return "https://api.twitch.tv/kraken/oauth2/authorize" +
			"?response_type=code" +
			"&client_id=" + this.clientID +
			"&redirect_uri=" + encodeURIComponent(this.redirectURL) +
			"&scope=" + encodeURIComponent(scopes.join(" ")) +
			"&state=" + state;
		*/
	}

	// Emit a code letting everything else know we need auth, and warn the user in the log.
	promptForToken() {
		this.emit("NeedToken", this.tokenURL(this.scopes, "TMILogin"));
		log.warn("Please Authorize me by going to " + this.tokenURL(this.scopes, "TMILogin"));
	}
	
	// When we recieve a token (for this instance only)
	completeToken(code, state, nonce) {
		log.debug("Received token code", code);
		return new Promise((resolve, reject) => {
			api({
				method: "POST",
				url: this.URLMaker(["oauth2", "token"], {}),
				json: true,
				headers: {
					"Accept": "application/vnd.twitchtv.v5+json",
					"Authorization": "OAuth" + this.oAuthToken,
					"Client-ID": this.clientID
				},
				qs: {
					"client_id": this.clientID,
					"client_secret": Secrets.clientSecret,
					"grant_type": "authorization_code",
					"redirect_uri": this.redirectURL,
					"code": code,
				}
			}, (err, res, body) => {
				if (body && body.access_token) {
					if (state == "TMILogin") {
						this.getMyTokenDetails(body.access_token);
					} else {
						this.verifyTwitchJWT(body["id_token"]).then((jwtToken) => {
							if (jwtToken.nonce == nonce) this.getTokenDetails(body.access_token).then((token) => {
								this.emit("TokenReceieved", token);
								resolve({ token: token, valid: true });
							});
							else reject("Incorrect Nonce");
						}).catch((err) => {
							reject(err);
						});
					}
				} else if (body) {
					reject(body);
				} else {
					reject(err);
				}
			});
		});	
	}
	hasToken() {
		if (!this.tokenIsValid) {
			// Do something
		}
		return this.tokenIsValid;
	}
}
log.info("Making a TwitchAPI");
var Twitch = new TwitchAPI();
module.exports = Twitch;