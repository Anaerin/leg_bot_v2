"use strict";
const EventEmitter = require("events");

class Plugin extends EventEmitter {
	constructor(client, channel) {
		super();
		this.client = client;
		this.channel = channel;
	}
	static get description() {
		throw new SyntaxError("Description is not defined!");
	}
	static get name() {
		throw new SyntaxError("Name is not defined!");
	}
	static get configuration() {
		throw new SyntaxError("Configuration is not defined");
	}
	static initDatabase(DB) {
		return true;
	}
	onEnable() {
		return true;
	}
	onDisable() {
		return true;
	}
}

module.exports = Plugin;