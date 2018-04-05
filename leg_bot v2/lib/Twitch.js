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
//const Request = require("request");
const RequestPromise = require("request-promise");
//const api = client.api;
const api = RequestPromise;
const Settings = require("./settings.js");
const Secrets = require("../secrets.js");
const EventEmitter = require("events");
const log = require("./log.js");
const jwt = require("jsonwebtoken");
const jwk = require("jwk-to-pem");
const DB = require("../db/index.js");
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
			"id": "twitchUserID",
			"login": "userName",
			"offline_image_url": "offlineImageURL",
			"profile_image_url": "profileImageURL",
			type: "userType",
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

	// Call the twitch API to get the details of the token we have. Need username for logging in to IRC, for instance.
	// If we don't have a valid token, prompt to get us one.
	async getMyTokenDetails(token) {
		this.tokenIsValid = false;
		try {
			let response = await this.getTokenDetails(token);
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
				this.emit("GotValidToken", {
					token: this.oAuthToken,
					userName: this.userName,
					userID: this.userID
				});
			}
		} catch (e) {
			throw e;
		}
	}

	async getFromNewAPI(path, querystring = {}) {
		let request = this.baseRequestNewAPI;
		request.url = this.NewAPIURLMaker(path, querystring);
		return api(request);
	}

	async getUserByID(userID) {
		log.debug("Searching for, or creating, user with ID %s", userID);
		//let created = false;
		//let foundUser = await DB.models.User.findOne({ where: {	twitchUserID: userID }});
		let [foundUser, created] = await DB.models.User.findOrCreate({
			where: {
				twitchUserID: userID
			},
			defaults: {
				twitchUserID: userID
			}
		});
		if (created || Date.parse(foundUser.lastQueried) < (Date.now() - 43200000)) {
			let userData = await this.getFromNewAPI(["users"], {
				id: userID
			});
			userData = userData.data[0];
			if (foundUser.userName && foundUser.userName != userData.login) {
				let createdHistory = await DB.models.UserHistory.create({
					userID: userData.id,
					timeChanged: Date.now(),
					oldUserName: foundUser.userName
				});
				foundUser.addUserHistory(createdHistory);
				this.emit("NewUsername", foundUser.userName, userData.id, userData.login);
				this.emit("NewUsername" + foundUser.userName, userData.id, userData.login);
			}
			for (let response in this.twitchResponseMapping) {
				foundUser[this.twitchResponseMapping[response]] = userData[response];
			}
			foundUser.lastQueried = Date.now();
			return foundUser.save();
		} else if (foundUser) {
			return foundUser;
		}
	}

	async getUserByName(userName) {
		let [foundUser, created] = await DB.models.User.findOrCreate({
			where: {
				userName: userName
			},
			defaults: {
				userName: userName
			}
		});
		if (Array.isArray(foundUser)) foundUser[0];
		if (created || Date.parse(foundUser.lastQueried) < (Date.now() - 43200000)) {
			let userData = await this.getFromNewAPI(["users"], {
				login: userName
			});
			userData = userData.data[0];
			for (let response in this.twitchResponseMapping) {
				foundUser[this.twitchResponseMapping[response]] = userData[response];
			}
			foundUser.lastQueried = Date.now();
			foundUser.save();
			return foundUser;
		} else if (foundUser) {
			return foundUser;
		}
	}

	async getTokenDetails(token) {
		let request = this.baseRequest;
		request.url = this.URLMaker([""]);
		request.headers.Authorization = "OAuth " + token;
		log.info("Requesting token details", request);
		let body = await api(request);
		log.debug("Got the following token", JSON.stringify(body));
		if (body && body.token && body.token.valid) {
			if (body.token.authorization) {
				return {
					token: token,
					userName: body.token.user_name,
					userID: body.token.user_id,
					scopes: body.token.authorization.scopes,
					valid: body.token.valid
				};
			} else {
				return {
					token: token,
					userName: body.token.user_name,
					userID: body.token.user_id,
					valid: body.token.valid
				};
			}
		} else {
			throw (body);
		}

	}

	async getChannel(token) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["channel"]);
		request.headers.Authorization = "OAuth " + token;
		return api(request);
	}

	async getChannelById(ChannelID) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID]);
		return api(request);
	}

	async updateChannel(token, ChannelID, status, game, delay, channel_feed_enabled) {
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
		return api(request);
	}

	async getChannelEditors(token, ChannelID) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID, "editors"]);
		request.headers.Authorization = "OAuth " + token;
		return api(request);
	}

	async getChannelFollowers(ChannelID, cursor) {
		let qs = {
			limit: 100
		};
		if (cursor) qs.cursor = cursor;
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID, "follows"], qs);
		return api(request);
	}

	async getChannelTeams(ChannelID) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID, "teams"]);
		return api(request);
	}

	async getChannelSubscribers(token, ChannelID, page) {
		let request = this.baseRequest;
		let qs = {
			limit: 100
		};
		if (page) qs.offset = page * 100;
		request.url = this.URLMaker(["channels", ChannelID, "subscriptions"], qs);
		request.headers.Authorization = "OAuth " + token;
		return api(request);
	}

	async checkChannelSubscriptionForUser(token, ChannelID, UserID) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID, "subscriptions", UserID]);
		request.headers.Authorization = "OAuth " + token;
		return api(request);
	}

	async getChannelVideos(ChannelID, page, broadcast_type, language) {
		let qs = {
			limit: 100
		};
		if (Array.isArray(broadcast_type)) qs.broadcast_type = broadcast_type.join(",");
		if (typeof broadcast_type === "string") qs.broadcast_type = broadcast_type;
		if (Array.isArray(language)) qs.language = language.join(",");
		if (typeof language === "string") qs.language = language;
		if (page) qs.offset = page * 100;
		let request = this.baseRequest;
		request.url = this.URLMaker(["channels", ChannelID, "videos"], qs);
		return api(request);
	}

	async startChannelCommercial(token, ChannelID, duration) {
		let request = this.baseRequest;
		request.method = "POST";
		request.headers.Authorization = "OAuth " + token;
		request.url = this.URLMaker(["channels", ChannelID, "commercial"]);
		request.body = duration;
		return api(request);
	}

	async resetStreamKey(token, ChannelID) {
		let request = this.baseRequest;
		request.method = "DELETE";
		request.headers.Authorization = "OAuth " + token;
		request.url = this.URLMaker(["channels", ChannelID, "stream_key"]);
		return api(request);
	}

	async getChannelCommunity(token, ChannelID) {
		let request = this.baseRequest;
		request.headers.Authorization = "OAuth " + token;
		request.url = this.URLMaker(["channels", ChannelID, "community"]);
		return api(request);
	}

	async setChannelCommunity(token, ChannelID, CommunityID) {
		let request = this.baseRequest;
		request.headers.Authorization = "OAuth " + token;
		request.url = this.URLMaker(["channels", ChannelID, "community", CommunityID]);
		return api(request);
	}

	async removeChannelFromCommunity(token, ChannelID) {
		let request = this.baseRequest;
		request.method = "DELETE";
		request.headers.Authorization = "OAuth " + token;
		request.url = this.URLMaker(["channels", ChannelID, "community"]);
		return api(request);
	}

	async getChatBadgesByChannel(ChannelID) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["chat", ChannelID, "badges"]);
		return api(request);
	}

	async getChatEmoticonsBySet(emoteset) {
		let request = this.baseRequest;
		let qs = {};
		if (emoteset) qs.emoteset = emoteset;
		request.url = this.URLMaker(["chat", "emoticon_images"], qs);
		return api(request);
	}

	async getAllChatEmoticons() {
		let request = this.baseRequest;
		request.url = this.URLMaker(["chat", "emoticons"]);
		return api(request);
	}

	async getClip(slug) {
		let request = this.baseRequest;
		request.url = this.URLMaker(["clips", slug]);
		return api(request);
	}

	async getTopClips(channelNames, games, languages, period, trending, cursor) {
		let request = this.baseRequest;
		let qs = {
			limit: 100
		};
		if (Array.isArray(channelNames)) channelNames = channelNames.join(",");
		qs.channel = channelNames;
		if (Array.isArray(games)) games = games.join(",");
		qs.game = games;
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
		return api(request);
	}

	async getFollowedClips(token, cursor, trending) {
		let request = this.baseRequest;
		let qs = {};
		request.headers.Authorization = "OAuth " + token;
		if (cursor) qs.cursor = cursor;
		if (typeof trending !== "undefined") qs.trending = trending;
		request.url = this.URLMaker(["clips", "followed"], qs);
		return api(request);
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

	AuthAPIURLMaker(endpoint, querystring = {}) {
		let URL = "https://api.twitch.tv/api/" + endpoint.join("/");
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

	async verifyTwitchJWT(token) {
		let keys = await this.getOIDCKeys();
		return jwt.verify(token, keys, (err, decoded) => {
			if (err) throw (err);
			if (decoded) return decoded;
		});
	}

	async getOIDCKeys() {
		if (this.OIDCKeys) return this.OIDCKeys;
		let request = {
			json: true,
			method: "get",
			url: "https://api.twitch.tv/api/oidc/keys"
		};
		let body = await api(request);
		this.OIDCKeys = jwk(body.keys[0]);
		return this.OIDCKeys;
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
		return this.URLMaker(["oauth2", "authorize"], qs);
	}

	// Emit a code letting everything else know we need auth, and warn the user in the log.
	promptForToken() {
		this.emit("NeedToken", this.tokenURL(this.scopes, "TMILogin"));
		log.warn("Please Authorize me by going to " + this.tokenURL(this.scopes, "TMILogin"));
	}

	// When we recieve a token (for this instance only)
	async completeToken(code, state, nonce) {
		log.debug("Received token code", code);
		let body = await api({
			method: "POST",
			url: this.AuthAPIURLMaker(["oauth2", "token"], {}),
			json: true,
			qs: {
				"client_id": this.clientID,
				"client_secret": Secrets.clientSecret,
				"grant_type": "authorization_code",
				"redirect_uri": this.redirectURL,
				"code": code,
			}
		});
		if (body && body.access_token) {
			log.debug("oAuth2 token result: %s", JSON.stringify(body));
			if (state == "TMILogin") {
				return this.getMyTokenDetails(body.access_token);
			} else {
				try {
					let jwtToken = await this.verifyTwitchJWT(body["id_token"]);
					if (jwtToken.nonce == nonce) {
						let token = await this.getTokenDetails(body.access_token);
						this.emit("TokenReceieved", token);
						return {
							token: token,
							access_token: body.access_token,
							refresh_token: body.refresh_token,
							expires_in: body.expires_in,
							scope: body.scope,
							valid: true
						};
					}
				} catch (e) {
					log.debug("JWT Verification failed: %s", JSON.stringify(e));
					throw e;
				}
			}
		}
	}
	async refreshToken(refreshToken) {
		return api({
			method: "POST",
			url: this.URLMaker(["oauth2", "token"], {}),
			json: true,
			qs: {
				"client_id": this.clientID,
				"client_secret": Secrets.clientSecret,
				"grant_type": "refresh_token",
				"refresh_token": refreshToken,
			}
		});
	}
}
log.info("Making a TwitchAPI");
var Twitch = new TwitchAPI();
module.exports = Twitch;