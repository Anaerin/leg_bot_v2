'use strict';

/*
Node doesn't support ES6 imports.
import { Settings as DBSettings } from "../db/settings.js";
*/

//var DBSettings = require("../db/setting.js");

const DB = require("../db/index.js");
const DBSettings = DB.models.Setting;
const log = require("./log.js");

const settingsObj = new Map();


//let _settings = new DBSettings();

DBSettings.findAll().then(settings => {
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
				setting.save();
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