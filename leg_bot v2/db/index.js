"use strict";
var Sequelize = require("sequelize");
var dbConfig = require("../config.js");
var fs = require("fs");
var log = require("../lib/log.js");
var Models = {};

/*
import Channel from "./channel.js";
import Setting from "./setting.js";
import User from "./user.js";
*/
log.info("Setting up DB...");
switch (dbConfig.DBType) {
	case 'mysql':
		var options = {
			dialect: 'mysql',
			host: dbConfig.DBHost,
			logging: log.debug,
			timestamps: false
		};
		var DB = new Sequelize(dbConfig.DBFile, dbConfig.DBUsername, dbConfig.DBPassword, options);
		break;
	case 'sqlite':
		var options = {
			dialect: 'sqlite',
			storage: dbConfig.DBFile,
			logging: log.debug,
			timestamps: false,
			pool: {
				max: 1,
				min: 0
			},
			retry: {
				max: 5,
				match: [
					'SQLITE_BUSY: database is locked'
				]
			}
		};
		var DB = new Sequelize('', '', '', options);
		break;
	default:
		throw new Error("Unrecognised DB type");
}
log.info("DB Authenticating...");
DB.authenticate();
let path = __dirname;
path += "\\";
log.info("Loading DB Models from", path);
// Dynamically load all your models? Yes please!
let items = fs.readdirSync(path);
items.forEach(item => {
	if (item.endsWith(".js") && item != "index.js") {
		let modelName = item.substr(0, item.length - 3);
		log.info("Loading DB model %s...", modelName);
		let model = require("./" + item);
		Models[modelName] = model;
		Models[modelName].init(DB);
	}
});
for (let model in Models) {
	if (Models[model].relation) Models[model].relation(DB.models);
}
log.info("Syncing DB");
DB.sync({ alter: false });
log.info("DB Synced");
module.exports = DB;