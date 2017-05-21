'use strict';
var EventEmitter = require("events");

class PluginHandler {
	constructor() {
		this.plugins = {};
	}
	register(name, plugin) {
		if (this.plugins.hasOwnProperty(name)) {
			throw new TypeError("Plugin already registered under that name");
		} else {
			this.plugins[name] = plugin;
		}
	}
	call(name) {
		if (!this.plugins.hasOwnProperty(name)) {
			throw new TypeError("Plugin not registered with that name");
		} else {
			return this.plugins[name];
		}
	}
}

class Plugin extends EventEmitter {
	constructor(client) {
		super();
		this.client = client;
	}

	static get name() {
		throw Error("Name is not implemented");
		//return "Plugin name";
	}

	static get description() {
		throw Error("Description is not implemented");
		//return "Description goes here";
	}

	static get configuration() {
		throw Error("Configuration is not implemented");
		//return [];
	}

}

module.exports = Plugin;