"use strict";
const log = require("../lib/log.js");
const EventEmitter = require("events");
const Plugins = require("../lib/plugins");
const tmi = require("./client.js");

class Channel extends EventEmitter {
	constructor(client, channel) {
		super();
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
	onCommand(command, channel, userState, message, self) {
		//
	}
	onChat(channel, userState, message, self) {
		if (channel == this.channelName) {

			this.emit("onChat", userState, message, self);
		}
	}
	onCheer(channel, userState, message) {
		if (channel == this.channelName) {

			this.emit("onCheer", userState, message);
		}
	}
}