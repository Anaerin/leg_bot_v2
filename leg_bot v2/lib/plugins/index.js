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
		let items = fs.readdirSync(path);
		items.forEach(item => {
			if (!item.endsWith(".js")) {
				let plugin = require("./" + item);
				this.register(item, plugin);
			}
		});
		DB.sync();
	}
	register(name, plugin) {
		if (this.plugins.has(name)) {
			throw new TypeError("Plugin already registered under that name");
		} else {
			this.plugins.set(name, plugin);
			plugin.initDatabase(DB);
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
	get configuration() {
		let confs = [];
		this.plugins.forEach((plugin) => {
			let config = {};
			config = {
				name: plugin.name,
				description: plugin.description
			};
			if (plugin.configuration) {
				config.options = plugin.configuration;
			}
			confs.push(config);
		});
		return confs;
	}
}

const PluginHandler = new pluginHandler();
module.exports = PluginHandler;