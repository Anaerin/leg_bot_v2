"use strict";
const EventEmitter = require("events");

class Plugin extends EventEmitter {
	constructor(channel) {
		super();
		this.channel = channel;
	}
	static get description() {
		throw new SyntaxError("Description is not defined!");
	}
	static get name() {
		throw new SyntaxError("Name is not defined!");
	}
	static get configuration() {
		//Optional
		return false;
	}
	static initDatabase() {
		//Optional Parameter
	}
	static setupDBRelations() {
		//Optional Parameter
	}
	onEnable() {
		return true;
	}
	onDisable() {
		return true;
	}
}

module.exports = Plugin;