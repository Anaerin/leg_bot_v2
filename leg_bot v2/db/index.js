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
			logging: log.debug
		};
		var DB = new Sequelize(dbConfig.DBFile, dbConfig.DBUsername, dbConfig.DBPassword, options);
		break;
	case 'sqlite':
		var options = {
			dialect: 'sqlite',
			storage: dbConfig.DBFile,
			logging: log.debug
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
let items = fs.readdirSync(path)
items.forEach(item => {
	if (item.endsWith(".js") && item != "index.js") {
		let modelName = item.substr(0, item.length - 3);
		let model = require("./" + item);
		Models[modelName] = model;
		Models[modelName].init(DB);
	}
});
for (let model in Models) {
	if (Models[model].relation) Models[model].relation(DB.models);
}
DB.sync();
module.exports = DB;
//export default DB;

/*
var Sequelize = require("sequelize");
var sql = new Sequelize('leg_bot', null, null, { dialect: 'sqlite', storage: 'legbot.sqlite' });

var User = sql.define("user", {
	username: {
		type: Sequelize.STRING,
		allowNull: false
	},
	twitchToken: {
		type: Sequelize.STRING,
		allowNull: true
	}
});

var Channel = sql.define("channel", {
	channelname: {
		type: Sequelize.STRING,
		allowNull: false
	},
	active: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		default: true
	}
});

var ChannelUser = sql.define("channelUser", {
	isModerator: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		default: false
	}
});

Channel.belongsTo(User, { as: "Owner" });
Channel.belongsToMany(User, { as: "Users", through: ChannelUsers });

var Plugin = sql.define("plugins", {
	active: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		default: false
	},
	type: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

Channel.hasMany(Plugin);

var Config = sql.define("configuration", {
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	value: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

Channel.hasMany(Config);
Plugin.hasMany(Config);
*/