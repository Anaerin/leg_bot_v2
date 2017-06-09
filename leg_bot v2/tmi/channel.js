"use strict";
const log = require("../lib/log.js");
const EventEmitter = require("events");
const Plugins = require("../lib/plugins");

class Channel extends EventEmitter {
	constructor(client, channel) {
		super();
		this.channelName = channel.name;
		this.channelID = channel.channelID;
		client.on("onChat", this.onChat);
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