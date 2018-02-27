"use strict";

const DB = require("../db/index.js");
const DBSettings = DB.models.Setting;
const log = require("./log.js");
const config = require("../config.js");
const settingsObj = new Map();

DBSettings.findAll().then(settings => {
	log.debug("Retrieved from DB, now building settings proxy");
	settings.forEach(setting => {
		//settingsObj[setting.name] = setting.value;
		settingsObj.set(setting.name,setting);
	});
	settingsObj.set("_loaded",true);
});

const Settings = new Proxy(settingsObj, {
	get: (target, name) => {
		if (name === "_loaded" && target.get("_loaded")) return true;
		if (target.has(name)) return target.get(name)["value"];
		if (config.hasOwnProperty(name)) return config[name];
		return false;
	},
	set: (target, name, value) => {
		if (target.has(name)) {
			let obj = target.get(name);
			obj["value"] = value;
			obj.save();
		} else {
			DBSettings.create({ name: name, value: value }).then(setting => {
				target.set(name, setting);
			});
		}
		/* 
		DBSettings.findOrCreate({ where: { name: name } }).spread((setting, created) => {
			if (created) setting['name'] = name;
			setting['value'] = value;
			//setting.save();
		});
		*/
		return true;
	}
});

module.exports = Settings;