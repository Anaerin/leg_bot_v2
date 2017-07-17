'use strict';
/*
Node doesn't support ES6 imports.
import EventEmitter from 'events';
//import Settings from '../settings.js';
import tmi from 'tmi.js';
import Twitch from '../lib/Twitch.js';
import log from '../lib/log.js';
import antiSpam from "../lib/antispam.js";
*/

const EventEmitter = require("events");
const tmi = require("tmi.js");
const Twitch = require("../lib/Twitch.js");
const log = require("../lib/log.js");
const antiSpam = require("../lib/antispam.js");
const Settings = require("../lib/settings.js");

class tmiClient extends EventEmitter {
	constructor() {
		super();
		log.info("Constructing tmiClient...");
		if (Twitch.tokenIsValid) {
			log.info("Got token, doing connect");
			this.userName = Twitch.userName;
			this.oAuthToken = Twitch.oAuthToken;
			this.userID = Twitch.userID;
			this.doConnect();
		} else {
			log.info("No token, waiting for event.");
			Twitch.on("GotValidToken", (Args) => {
				this.userName = Args.userName;
				this.oAuthToken = Args.token;
				this.userID = Args.userID;
				this.doConnect();
			});
		}
	}
	doConnect() {
		var options = {
			connection: {
				reconnect: true,
				secure: true
			},
			identity: {
				username: this.userName,
				password: "oauth:" + this.oAuthToken
			},
			channels: ["#" + this.userName],
			logger: log
		};
		this.client = new tmi.client(options);
		this.bindEvents();
		this.client.connect();
	}
	bindEvents() {
		// Declare what events we want to listen for.
		const allEvents = [
			"Action",
			"Ban",
			"Cheer",
			"ClearChat",
			"Connected",
			"Connecting",
			"Disconnected",
			"EmoteOnly",
			"EmoteSets",
			"FollowersOnly",
			"Hosted",
			"Hosting",
			"Join",
			"Logon",
			"Message",
			"Mod",
			"Mods",
			"Notice",
			"Part",
			"Ping",
			"Pong",
			"R9kBeta",
			"Reconnect",
			"ReSub",
			"RoomState",
			"ServerChange",
			"SlowMode",
			"Subscription",
			"Timeout",
			"Unhost",
			"Unmod",
			"Whisper"
		];
		const channelEventList = [
			"Action",
			"Ban",
			"Chat",
			"Cheer",
			"ClearChat",
			"EmoteOnly",
			"FollowersOnly",
			"Hosted",
			"Hosting",
			"Join",
			"Message",
			"Mod",
			"Mods",
			"Notice",
			"Part",
			"R9kBeta",
			"ReSub",
			"RoomState",
			"ServerChange",
			"SlowMode",
			"Subscription",
			"Timeout",
			"Unhost",
			"Unmod"
		];
		// For each event...
		allEvents.forEach(ev => {
			// Bind to the event (in lower case, because TMI doesn't believe in capitalization)
			this.client.on(ev.toLowerCase(), () => {
				// Then schedule execution, with the arguments of this event forwarded
				setImmediate(() => {
					// And emit an event for it from us, with the arguments preserved.
					this.emit(ev, ...arguments);
				}, ...arguments);
			});
		});
		// For all the events that reference a channel...
		channelEventList.forEach(ev => {
			// Bind to the event, like above...
			this.client.on(ev.toLowerCase(), () => {
				// Then schedule execution asynchronously...
				setImmediate(() => {
					// And emit an event for this event and channel combination.
					this.emit(arguments[0] + " " + ev, ...arguments);
				});
			});
		});
		this.client.on("chat", this.onChat);
	}
	onChat(channel, userstate, message, self) {
		setImmediate((channel, userstate, message, self) => {
			//Async processing. Antispam goes here.
			if (!self && !userstate['mod']) {
				// This needs to be overhauled somewhat, but for now, this will do as a placeholder of sorts.
				
				//This user isn't me, and it isn't a mod. Let's see if we have spam...
				let matches = antiSpam.matchRule(message);
				if (matches) {
					//Oh boy! Fresh spam! Let's nuke'em!
					let timeout = 0;
					if (antiSpam.userTimeouts[userstate['user-id']]) timeout = antiSpam.userTimeouts[userstate['user-id']];
					timeout++;
					antiSpam.userTimeouts[userstate['user-id']] = timeout;
					//record the number of times user's been timed out, then use a wonderful exponential scale to calculate how long their timeout is.
					this.client.timeout(channel, userstate.username, Math.pow(4, timeout - 1), "AntiSpam matched rule " + matches.name);
					this.client.say(channel, "Antispam: Timed out " + userstate['display-name'] + " for " + Math.pow(4, timeout - 1) + " seconds (" + matches.name + ")");
					//Finally, add one to this rule's total.
					matches.increment('count', { by: 1 });
				}
			}

			this.emit("Chat", ...arguments);
			this.emit(arguments[0] + " " + "Chat", ...arguments);

			if (!self) {
				if (String(message).startsWith(Settings.CommandPrefix)) {
					let command = String(message).match("\\" + Settings.CommandPrefix + "(\w+)");
					if (command.length > 0) {
						this.emit(arguments[0] + " Command", command[0], ...arguments);
					}
				}
			}
		},...arguments);
	}
}

// We want a singleton, not a new instance of the class each time.
const Client = new tmiClient();
module.exports = Client;