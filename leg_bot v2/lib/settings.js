'use strict';
import { Settings as DBSettings } from "../db/settings.js";

let settingsObj = {};

let _settings = new DBSettings();

DBSettings.findAll({ raw: true }).then(settings => {
	settings.forEach(setting => {
		settingsObj[setting.name] = setting.value;
	});
	settingsObj._loaded = true;
});

let Settings = new Proxy(settingsObj, {
	get: (target, name) => {
		return target[name];
	},
	set: (target, name, value) => {
		DBSettings.findOrCreate({ where: { name: name } }).spread((setting, created) => {
			setting.value = value;
			setting.save().then(function () { });
		});
		target[name] = value;
		return true;
	}
});

export default Settings;