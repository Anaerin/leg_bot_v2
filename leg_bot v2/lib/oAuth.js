'use strict';
import api from 'tmi.js';
import Settings from '../db/settings.js';
import Secrets from '../secrets.js';
import EventEmitter from 'events';
import log from './log.js';

/* Welcome to the oAuth class.
 * This fun little class will attempt to authenticate a token with Twitch
 * So we can connect with tmi.
 * It will also verify other tokens, so we can handle users logging in in one place */

class oAuthClient extends EventEmitter {
	
	// Build the object, including it's event emitter.
	static constructor() {
		super();
		this.clientID = Secrets.clientID;
		this.redirectURL = Secrets.redirectURL;
		this.scopes = ['user_read', 'user_follows_add', 'chat_login'];
		this.tokenIsValid = false;
		
		// If the settings are loaded, load the token details.
		// Otherwise, defer loading until the settings object says it's ready.
		if (Settings._loaded) {
			this.loadToken();
		} else {
			Settings.on("SettingsLoaded", () => {
				this.loadToken();
			});
		}	
	}

	// Load the token, if it's valid, or prompt for auth.
	static loadToken() {
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
	static getMyTokenDetails(token) {
		this.tokenIsValid = false;
		this.getTokenDetails(token).then((response) => {
			this.tokenIsValid = true;
			for (let scope of this.scopes) {
				if (!response.scopes.contains(scope)) {
					this.tokenIsValid = false;
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
	
	static getTokenDetails(token) {
		return new Promise((resolve, reject) => {
			let req = api({
				url: "https://api.twitch.tv/kraken",
				method: "get",
				headers: {
					"Client-ID": this.clientID,
					"Authorization": 'OAuth' + token,
					"Accept": "application/vnd.twitchtv.v5+json"
				}
			}, (err, res, body) => {
				if (err) { reject(err); }
				if (body && body.token && body.token.valid) {
					resolve({
						token: token,
						userName: body.token.user_name,
						userID: body.token.user_id,
						scopes: body.authorization.scopes
					});
				} else {
					reject(body);
				}
			});
		});
	}

	// Emit a code letting everything else know we need auth, and warn the user in the log.
	static promptForToken() {
		this.emit("NeedToken", "https://api.twitch.tv/kraken/oauth2/authorize" +
			"?response_type=code" +
			"&client_id=" + this.clientID +
			"&redirect_uri=" + encodeURIComponent(this.redirectURL) +
			"&scope=" + encodeURIComponent(this.scopes.join(" ")) +
			"&state=" + "TMILogin";
		log.warn("Please authorize me by going to " +
			"https://api.twitch.tv/kraken/oauth2/authorize" +
			"?response_type=code" +
			"&client_id=" + this.clientID +
			"&redirect_uri=" + encodeURIComponent(this.redirectURL) +
			"&scope=" + encodeURIComponent(this.scopes.join(" ")) +
			"&state=" + "TMILogin";
	}
	
	// When we recieve a token (for this instance only)
	static completeToken(code, state) {
		let req = api({
			method: "POST",
			url: "https://api.twitch.tv/kraken/oauth2/token",
			json: true,
			headers: {
				"Accept": "application/vnd.twitchtv.v5+json",
				"Authorization": "OAuth" + this.oAuthToken,
				"Client-ID": this.clientID
			},
			form: {
				"client_id": this.clientID,
				"client_secret": Secrets.clientSecret,
				"grant_type": "authorization_code",
				"redirect_uri": this.redirectURL,
				"code": code
			}
		}, (err, res, body) => {
			if (body && body.access_token) {
				if (state == "TMILogin") {
					this.getMyTokenDetails(this.oAuthToken);
				} else {
					this.getTokenDetails(body.access_token).then((token) => {
						this.emit("TokenReceieved", token);
					});
				}
			}
		});
	}
	static hasToken() {
		return this.tokenIsValid;
	}
}
let oAuth = new oAuthClient();
export default oAuth;