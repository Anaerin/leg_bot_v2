'use strict';

/*
Node doesn't support ES6 imports.
import { Settings as DBSettings } from "../db/settings.js";
*/

//var DBSettings = require("../db/setting.js");

var DB = require("../db/index.js");
var DBSettings = DB.models.Setting;

let settingsObj = {};

//let _settings = new DBSettings();

console.log(DBSettings);

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

module.exports = Settings;