"use strict";
//const DB = require("../db");
//const Twitch = require("../lib/Twitch");
const EventEmitter = require("events");
const Plugins = require("../lib/plugins");
const log = require("../lib/log");
module.exports = class Channel extends EventEmitter {
	constructor(channelName, channelDBObj, client) {
		super();
		this.client = client;
		this.user = channelDBObj;
		this.channelName = channelName;
		this.settings = this.user.getSettings();
		this.settingMap = this.setupSettingMap();
		this.plugins = {};
		this.initializePlugins();
		this.whisper = this.client.client.whisper;
		this.join();
	}
	async join() {
		if (this.client.client.readyState == "OPEN") {
			try {
				log.debug("Joining %s", this.channelName);
				await this.client.client.join("#" + this.channelName);
			} catch (e) {
				log.debug("Error joining: %s", e);
			}
		} else {
			this.client.client.once("connected", async () => {
				try {
					log.debug("Joining %s on event", this.channelName);
					await this.client.client.join("#" + this.channelName);
				} catch (e) {
					log.debug("Error joining on connected: %s", e);
				}
			});
		}
	}
	async action(message) {
		return this.client.client.action("#" + this.channelName, message);
	}
	async ban(username, reason) {
		return this.client.client.ban("#" + this.channelName, username, reason);
	}
	async clear() {
		return this.client.client.clear("#" + this.channelName);
	}
	async emoteonly() {
		return this.client.client.emoteonly("#" + this.channelName);
	}
	async emoteonlyoff() {
		return this.client.client.emoteonlyoff("#" + this.channelName);
	}
	async followersonly(length) {
		return this.client.client.followersonly("#" + this.channelName, length);
	}
	async followersonlyoff() {
		return this.client.client.followersonlyoff("#" + this.channelName);
	}
	async mod(username) {
		return this.client.client.mod("#" + this.channelName, username);
	}
	async mods() {
		return this.client.client.mods("#" + this.channelName);
	}
	async r9kbeta() {
		return this.client.client.r9kbeta("#" + this.channelName);
	}
	async r9kbetaoff() {
		return this.client.client.r9kbetaoff("#" + this.channelName);
	}
	async say(message) {
		return this.client.client.say("#" + this.channelName, message);
	}
	async slow(length = 300) {
		return this.client.client.slow("#" + this.channelName, length);
	}
	async slowoff() {
		return this.client.client.slowoff("#" + this.channelName);
	}
	async subscribers() {
		return this.client.client.subscribers("#" + this.channelName);
	}
	async subscribersoff() {
		return this.client.client.subscribersoff("#" + this.channelName);
	}
	async timeout(username, length = 300, reason) {
		return this.client.client.timeout("#" + this.channelName, username, length, reason);
	}
	async unban(username) {
		return this.client.client.unban("#" + this.channelName, username);
	}
	async unmod(username) {
		return this.client.client.unmod("#" + this.channelName, username);
	}

	async setupSettingMap() {
		let settings = await this.settings;
		return new Promise((resolve) => {
			let settingMap = new Map();
			settings.forEach((setting) => {
				settingMap.set(setting.name, setting);
			});
			resolve(settingMap);
		});
	}
	async initializePlugins() {
		let settingMap = await this.settingMap;
		Plugins.forEach((plugin) => {
			if (settingMap.has(plugin.name) && settingMap.get(plugin.name).value == "true") {
				this.plugins[plugin.name] = new plugin(this);
			}
		});
	}
};