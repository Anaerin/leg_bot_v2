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
const Settings = require("../lib/settings.js");
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
			this.user = Twitch.getUserByID(this.userID);
			this.doConnect();
		} else {
			log.info("No token, waiting for event.");
			Twitch.on("GotValidToken", (Args) => {
				this.userName = Args.userName;
				this.oAuthToken = Args.token;
				this.userID = Args.userID;
				this.user = Twitch.getUserByID(this.userID);
				this.doConnect();
			});
		}

	}
	async doConnect() {
		var options = {
			connection: {
				reconnect: true,
				secure: true
			},
			identity: {
				username: this.userName,
				password: "oauth:" + this.oAuthToken
			},
			//channels: channelsToJoin,
			logger: log
		};
		this.client = new tmi.client(options);

		let users = await DB.models.User.findAll({
			where: {
				active: true
			}
		});
		users.forEach((user) => {
			this.channels[user.userName] = {
				user: user,
				channel: new Channel(user.userName, user, this)
			};
			// channelsToJoin.push(user.userName);
		});
		this.channels[this.userName] = {
			user: await this.user,
			channel: new Channel(this.userName, await this.user, this)
		};
		this.bindEvents();
		this.client.connect();
		this.on("#" + this.userName + " Message", (channel, userstate, message, self) => {
			if (!self) {
				let displayName = userstate["display-name"];
				if (!displayName) displayName = userstate["username"];
				log.debug("CHAT: userstate looks like this: %s", JSON.stringify(userstate));
				log.debug("CHAT: %s just said \"%s\" in our channel!", userstate["display-name"], message);
			}
		});
		/*

		This should happen up there ^^

		channelsToJoin.forEach(async (channel) => {
			if (this.channels.hasOwnProperty(channel)) {
				if (!this.channels[channel].user) {
					// Okay, so I have this channel as a DB object. Add the JS object to it.
					this.channels[channel].user = await Twitch.getUserByName(channel); // new Channel(this.client, chan);
				}
				if (!this.channels[channel]) {
					this.channels[channel].channel = new Channel(channel, this.channels[channel].user, this);
				}
			} else {
				this.channels[channel] = {};
				this.channels[channel].user = await Twitch.getUserByName(channel);
				this.channels[channel].channel = new Channel(channel, this.channels[channel].user, this);
			}
		});
		*/
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
			this.client.on(ev.toLowerCase(), this.onEvent.bind(this, ev));
		});
		// For all the events that reference a channel...
		channelEventList.forEach(ev => {
			// Bind to the event, like above...
			this.client.on(ev.toLowerCase(), this.onChannelEvent.bind(this, ev));
		});
		this.client.on("chat", this.onChat.bind(this));
		this.client.on("chat", this.parseCommand.bind(this));
		this.client.on("join", this.onJoin.bind(this));
		this.client.on("NewUsername", this.onNewUsername.bind(this));
		this.client.on("Action", this.onAction.bind(this));
	}
	async onAction(channel, userstate, message, self) {
		if (!self) {
			if (message.includes("has donated") && this.client.isMod(channel, this.userName)) {
				//Seriously? People try this still?
				this.client.timeout(channel, userstate.username, 300, "Nobody falls for the 'Has Donated' scam");
			}
		}
	}
	async onNewUsername(oldUserName, twitchUserID, newUserName) {
		if (this.channels.hasOwnProperty(oldUserName)) {
			// A user that we are providing services for has changed their name.
			// This is rather inconvenient, and a little rude. Twitch doesn't have a way to notify us
			// so we have to detect it ourselves. Here's how I'm going to do it.

			// Get the new user details
			let userObj = await Twitch.getUserByID(twitchUserID);

			// Leave the old channel.
			await this.client.part("#" + oldUserName);

			// If there's a teardown function, call it.
			if (this.channels[oldUserName].channel.teardown) this.channels[oldUserName].channel.teardown();

			// Then delete the channel from our list.
			delete this.channels[oldUserName];

			// Now create a new one.
			this.channels[newUserName] = {
				user: userObj,
				channel: new Channel(newUserName, userObj, this)
			};
		}
	}
	onEvent(event) {
		let args = [...arguments];
		// remove event type.
		args.shift();
		// And emit an event for this event.
		this.emit(event, ...args);
	}
	onChannelEvent(event) {
		let args = [...arguments];
		args.shift(); // remove the event name.
		let channel = args.shift().substring(1); // Grab the channel name and remove it too.
		// And emit an event for this event and channel combination.
		this.emit(channel + " " + event, ...args); // Events are almost free. Still, might want to remove this at some point.
		// If we've set up a channel for this event...
		if (this.channels.hasOwnProperty(channel) && this.channels[channel].channel) {
			// Use that channel object to emit the event in question.
			this.channels[channel].channel.emit(event, ...args);
		} else log.warning("Got event %s for channel %s when channel wasn't ready", event, channel);
	}
	async onJoin(channel, username, self) {
		/* 
		// I shouldn't have to do any of this anymore.
		// Leave it here just in case, but the user and channel properties of this.channels[chan] 
		// are being created on connect.

		if (self) {
			let chan = channel.substring(1);
			// I've just joined a channel. Do I have a reference to it already?
			if (this.channels.hasOwnProperty(chan) && this.channels[chan].user && this.channels[chan].channel) {
				// I do... That's odd.
			} else if (this.channels[chan].user) {
				// Okay, so I have this channel as a DB object. Add the JS object to it.
				this.channels[chan].user = await Twitch.getUserByName(chan); // new Channel(this.client, chan);
				this.channels[chan].channel = new Channel(chan, this.channels[chan].user, this);
			} else {
				log.debug("Joined channel %s, yet it's not in my channels list. Is it mine?", chan);
				// I've never seen this channel at all. Why am I joining it? It's probably mine
				// Best not to do anything.				
			}
		}
		*/
	}
	async parseCommand(channel, userstate, message, self) {
		if (self) return;
		let chan = channel.substring(1);
		let args = [...arguments];
		args.shift();
		if (message.startsWith(Settings.CommandPrefix)) {
			let messageSplit = message.split(" ", 1)[0].substring(Settings.CommandPrefix.length).toLowerCase();
			log.debug("Command received: %s", messageSplit);
			this.emit("Command " + messageSplit, ...arguments);
			this.emit("Command " + chan + " " + messageSplit, ...args);
			if (this.channels.hasOwnProperty(chan) && this.channels[chan].channel) {
				this.channels[chan].channel.emit("Command " + messageSplit, ...args);
			}
		}
	}
	async onChat(channel, userstate, message, self) {
		let chan = channel.substring(1);
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
					await this.client.timeout(channel, userstate.username, 5, "Antispam: Duplicate message (>3) detected");
					await this.client.r9kbeta(channel);
					setTimeout(() => {
						this.client.r9kbetaoff(channel);
					}, 10000);
				}
			}

			// Let's update the seen record.
			let user = await Twitch.getUserByID(userstate["user-id"]);
			if (!user.lastSeen) {
				let linkRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g;
				if (linkRegex.test(message)) {
					if (this.client.isMod(this.userName)) {
						this.client.timeout(channel, userstate.username, 5, "Antispam: Previously unseen user posting a link");
					}
				} else {
					let channelObj;
					if (userstate["room-id"]) channelObj = await Twitch.getUserByID(userstate["room-id"]);
					else channelObj = await Twitch.getUserByName(chan);
					user.lastSeen = Date.now();
					user.setLastSeenChannel(channelObj);
				}
			} else {
				let channelObj = await Twitch.getUserByName(chan);
				user.lastSeen = Date.now();
				user.setLastSeenChannel(channelObj);
			}
		}
	}
}
// We want a singleton, not a new instance of the class each time.
const Client = new tmiClient();
module.exports = Client;