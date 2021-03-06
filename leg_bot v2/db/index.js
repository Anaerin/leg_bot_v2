﻿"use strict";
var Sequelize = require("sequelize");
var dbConfig = require("../config.js");
var fs = require("fs");
var log = require("../lib/log.js");
var Models = {};
var Path = require("path");
const Plugins = require("../lib/plugins");
const Op = Sequelize.Op;
const operatorsAliases = {
	$eq: Op.eq,
	$ne: Op.ne,
	$gte: Op.gte,
	$gt: Op.gt,
	$lte: Op.lte,
	$lt: Op.lt,
	$not: Op.not,
	$in: Op.in,
	$notIn: Op.notIn,
	$is: Op.is,
	$like: Op.like,
	$notLike: Op.notLike,
	$iLike: Op.iLike,
	$notILike: Op.notILike,
	$regexp: Op.regexp,
	$notRegexp: Op.notRegexp,
	$iRegexp: Op.iRegexp,
	$notIRegexp: Op.notIRegexp,
	$between: Op.between,
	$notBetween: Op.notBetween,
	$overlap: Op.overlap,
	$contains: Op.contains,
	$contained: Op.contained,
	$adjacent: Op.adjacent,
	$strictLeft: Op.strictLeft,
	$strictRight: Op.strictRight,
	$noExtendRight: Op.noExtendRight,
	$noExtendLeft: Op.noExtendLeft,
	$and: Op.and,
	$or: Op.or,
	$any: Op.any,
	$all: Op.all,
	$values: Op.values,
	$col: Op.col
};

/*
import Channel from "./channel.js";
import Setting from "./setting.js";
import User from "./user.js";
*/
log.info("Setting up DB...");
let options;
var DB;
switch (dbConfig.DBType) {
	case "mysql":
		options = {
			dialect: "mysql",
			host: dbConfig.DBHost,
			logging: (msg) => log.debug(msg),
			timestamps: false,
			operatorsAliases: operatorsAliases
		};
		DB = new Sequelize(dbConfig.DBFile, dbConfig.DBUsername, dbConfig.DBPassword, options);
		break;
	case "sqlite":
		options = {
			dialect: "sqlite",
			storage: dbConfig.DBFile,
			logging: (msg) => {
				log.info(msg);
			},
			timestamps: false,
			// sqlite does not support multiple connections. Make sure the connection pool only has 1 connection.
			pool: {
				max: 1,
				min: 0
			},
			// With only one connection, and asynchronous DB access, we're going to get timeouts and locking issues.
			// Make sure Sequelize will retry in case of failure.
			retry: {
				max: 5,
				match: [
					"SQLITE_BUSY: database is locked"
				]
			},
			operatorsAliases: operatorsAliases
		};
		DB = new Sequelize("", "", "", options);
		break;
	default:
		throw new Error("Unrecognised DB type");
}
// Now DB connection is set up, Authenticate to it.
log.info("DB Authenticating...");
DB.authenticate();

// Get the current path
let path = __dirname;

// Add on the directory separator (to get the contents of that directory)
path += Path.sep;
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
Plugins.initializeDB(DB);
for (let model in Models) {
	if (Models[model].relation) {
		log.info("Setting DB relations for model %s", model);
		Models[model].relation(DB.models);
	}
}
Plugins.setupDBRelations(DB);
log.info("Syncing DB");
DB.sync({
	alter: false
});
log.info("DB Synced");
module.exports = DB;