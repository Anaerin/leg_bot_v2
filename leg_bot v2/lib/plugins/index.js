"use strict";

const EventEmitter = require("events");
const fs = require("fs");
const log = require("../log.js");

class pluginHandler extends EventEmitter {
	constructor() {
		super();
		this.plugins = new Map();
		let path = __dirname;
		let items = fs.readdirSync(path);
		log.debug("Loading plugins...");
		items.forEach(item => {
			if (!item.endsWith(".js")) {
				log.debug("Loading plugin %s...",item);
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
	initializeDB(DB) {
		this.plugins.forEach((plugin) => {
			log.info("Loading plugin DB model(s) for %s", plugin.name);
			if (plugin.initializeDB) plugin.initializeDB(DB);
		});
	}
	setupDBRelations(DB) {
		this.plugins.forEach((plugin) => {
			log.info("Setting plugin DB relations for %s", plugin.name);
			if (plugin.setupDBRelations) plugin.setupDBRelations(DB);
		});
	}
}

const PluginHandler = new pluginHandler();
module.exports = PluginHandler;