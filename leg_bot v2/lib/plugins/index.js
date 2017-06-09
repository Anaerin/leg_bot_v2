'use strict';

const EventEmitter = require("events");
const fs = require("fs");
const log = require("../log.js");
const DB = require("../../db");

class pluginHandler extends EventEmitter {
	constructor() {
		super();
		this.plugins = new Map();
		let path = __dirname;
		let items = fs.readdirSync(path)
		items.forEach(item => {
			if (!item.endsWith(".js")) {
				let plugin = require("./" + item);
				this.register(item, plugin);
			}
		});
	}
	register(name, plugin) {
		if (this.plugins.has(name)) {
			throw new TypeError("Plugin already registered under that name");
		} else {
			this.plugins.set(name, plugin);
			plugin.database(DB);
		}
	}
	call(name) {
		if (!this.plugins.has(name)) {
			throw new TypeError("Plugin not registered with that name");
		} else {
			return this.plugins.get(name);
		}
	}
	forEach(callback) {
		this.plugins.forEach(callback);
	}
}

const PluginHandler = new pluginHandler();
module.exports = PluginHandler;