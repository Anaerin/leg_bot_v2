'use strict';
import EventEmitter from 'events';
import Settings from '../settings.js';
import tmi from 'tmi.js';
import Twitch from '/lib/Twitch.js';
class Client extends EventEmitter {
	constructor() {
		super();
		if (Twitch.tokenIsValid) {
			this.userName = Twitch.userName;
			this.oAuthToken = Twitch.oAuthToken;
			this.userID = Twitch.userID;
			this.doConnect();
		} else {
			Twitch.on("GotValidToken", (Args) => {
				this.userName = Args.userName;
				this.oAuthToken = Args.token;
				this.userID = Args.userID;
				this.doConnect();
			});
		}
	}
	static doConnect() {
		var options = {
			connection: {
				reconnect: true
			},
			identity: {
				username: this.userName,
				password: "oauth:" + this.token
			}
		};
		this.client = new tmi.client(options);
		this.client.connect();
	}
}