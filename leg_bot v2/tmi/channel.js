"use strict";
const log = require("../lib/log.js");
const EventEmitter = require("events");
//const Plugins = require("../lib/plugins");
const tmi = require("./client.js");
const Settings = require("../lib/settings.js");

module.exports = class Channel extends EventEmitter {
	constructor(client, channel) {
		super();
		log.debug("Constructing channel for %s", channel.name);
		this.channelName = channel.name;
		this.channelID = channel.channelID;
		const eventList = [
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
		eventList.forEach((eventName) => {
			tmi.on(this.channelName + " " + eventName, () => {
				this.onEvent(eventName, ...arguments);
			});
		});
	}
	onEvent() {
		let args = arguments;
		let event = args.shift();
		let channel = args.shift();
		if (channel == this.channelName) this.emit(event, ...args);
	}
	/* onCommand(command, channel, userState, message, self) {
		//
	} */
	onChat(channel, userState, message, self) {
		if (channel == this.channelName) {
			this.emit("onChat", userState, message, self);
			if (!self) {
				if (String(message).startsWith(Settings.CommandPrefix)) {
					let command = String(message).match("$" + Settings.CommandPrefix + "(\\w+)");
					if (command.length > 0) {
						this.emit("onCommand", command[0], ...arguments);
						this.emit("onCommand " + command[0], ...arguments);
					}
				}
			}
		}
	}
	onCheer(channel, userState, message) {
		if (channel == this.channelName) {

			this.emit("onCheer", userState, message);
		}
	}
};