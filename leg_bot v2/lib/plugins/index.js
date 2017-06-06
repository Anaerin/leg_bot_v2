'use strict';

const EventEmitter = require("events");
const fs = require("fs");
const log = require("../log.js");
const DB = require("../../db");

class Plugin extends EventEmitter {
	constructor(client, channel) {
		super();
		
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
	static get database(sequelize) {
		return true;
	}
	onEnable() {
		return true;
	}
	onDisable() {
		return true;
	}
}

class pluginHandler extends EventEmitter {
	constructor() {
		super();
		this.plugins = {};
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
		if (this.plugins.hasOwnProperty(name)) {
			throw new TypeError("Plugin already registered under that name");
		} else {
			this.plugins[name] = plugin;
			plugin.database(DB);
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

const PluginHandler = new pluginHandler();
module.exports = { PluginHandler, Plugin };