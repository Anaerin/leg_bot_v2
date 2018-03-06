"use strict";
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
// const Settings = require("../lib/settings.js");
const Channel = require("./channel.js");
const DB = require("../db");

class tmiClient extends EventEmitter {
	constructor() {
		super();
		this.channels = {};
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
		let channelsToJoin = ["#" + this.userName];
		DB.models.User.findAll({
			where: {
				active: true
			}
		}).then((users) => {
			users.forEach((user) => {
				this.channels[user.userName] = user;
				channelsToJoin.push("#" + user.userName);
			});
		});
		var options = {
			connection: {
				reconnect: true,
				secure: true
			},
			identity: {
				username: this.userName,
				password: "oauth:" + this.oAuthToken
			},
			channels: channelsToJoin,
			logger: log
		};
		this.client = new tmi.client(options);
		this.bindEvents();
		this.client.connect();
		this.on("#" + this.userName + " Message",(channel, userstate, message, self) => {
			if (!self) {
				let displayName = userstate["display-name"];
				if (!displayName) displayName = userstate["username"];
				log.debug("CHAT: userstate looks like this: %s",userstate);
				log.debug("CHAT: %s just said \"%s\" in our channel!",userstate["display-name"],message);
			}
		});
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
			this.client.on(ev.toLowerCase(), this.onEvent.bind(this,ev));
		});
		// For all the events that reference a channel...
		channelEventList.forEach(ev => {
			// Bind to the event, like above...
			this.client.on(ev.toLowerCase(), this.onChannelEvent.bind(this,ev));
		});
		this.client.on("chat", this.onChat.bind(this));
		this.client.on("join", this.onJoin.bind(this));
	}
	onEvent(event) {
		let args = [...arguments];
		args.shift();
		setImmediate(() => {
			// And emit an event for this event and channel combination.
			this.emit(event, ...args);
		}, ...args);
		
	}
	onChannelEvent(event) {
		let args = [...arguments];
		args.shift();
		setImmediate(() => {
			// And emit an event for this event and channel combination.
			log.debug("EVENT: %s", args[0] + " " + event);
			this.emit(args[0] + " " + event, ...args);
		}, ...args);
	}
	onJoin(channel, username, self) {
		if (self) {
			// I've just joined a channel. Do I have a reference to it already?
			if (this.channels.hasOwnProperty(channel) && this.channels[channel].channel) {
				// I do... That's odd.
			} else if (this.channels.hasOwnProperty(channel)) {
				// Okay, so I have this channel as a DB object. Add the JS object to it.
				this.channels[channel].channel = new Channel(this.client, channel);
			} else {
				// I've never seen this channel at all. Why am I joining it? It's probably mine
				// Best not to do anything.				
			}
		}
	}
	onChat(channel, userstate, message, self) {
		if (!self) {
			// If this isn't me...
			if (!userstate["mod"] && this.client.isMod(this.userName)) {
				// And it's not a mod, and I am a mod, check for spam.
				let matches = antiSpam.matchRule(message);
				if (matches) {
					//Oh boy! Fresh spam! Let's nuke'em!
					let timeout = 0;
					if (antiSpam.userTimeouts[userstate["user-id"]]) timeout = antiSpam.userTimeouts[userstate["user-id"]];
					timeout++;
					antiSpam.userTimeouts[userstate["user-id"]] = timeout;
					//record the number of times user's been timed out, then use a wonderful exponential scale to calculate how long their timeout is.
					this.client.timeout(channel, userstate.username, Math.pow(4, timeout - 1), "AntiSpam matched rule " + matches.name);
					this.client.say(channel, "Antispam: Timed out " + userstate["display-name"] + " for " + Math.pow(4, timeout - 1) + " seconds (" + matches.name + ")");
				}
				
				if (antiSpam.alreadySaid(userstate, channel, message)) {
					this.client.timeout(channel, userstate.username, 5, "Antispam: Duplicate message (>3) detected");
					this.client.r9kbeta(channel).then(() => {
						setTimeout(() => {
							this.client.r9kbetaoff(channel);
						}, 10000);
					});
				}
			}

			// Let's update the seen record.
			Twitch.getUserByID(userstate["user-id"]).then((user) => {
				if (!user) {
					let linkRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
					if (linkRegex.test(message)) {
						if (this.client.isMod(this.userName)) {
							this.client.timeout(channel, userstate.username, 5, "Antispam: Previously unseen user posting a link");
						}
					} else {
						Twitch.getUserByName(channel.substring(1)).then((channelObj) => {
							user.setLastSeenChannel(channelObj);
						});
					}
				} else {
					Twitch.getUserByName(channel.substring(1)).then((channelObj) => {
						user.setLastSeenChannel(channelObj);
					});
				}
			});
		}
		if (!self) {
			// I don't care what I said.
			this.emit("Chat", ...arguments);
			this.emit(channel + " " + "Chat", ...arguments);
		}
	}
}

// We want a singleton, not a new instance of the class each time.
const Client = new tmiClient();
module.exports = Client;