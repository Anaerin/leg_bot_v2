"use strict";
var Sequelize = require("sequelize");
var dbConfig = require("../config.js");
var fs = require("fs");
var Models = {};

// Dynamically load all your models? Yes please!
fs.readdir(__dirname + "/db", (err, items) => {
	items.forEach(item => {
		if (item.endsWith(".js") && item != "index.js") {
			Models[item.substr(0, item.length - 4)] = require("./" + item);
		}
	});
});

/*
import Channel from "./channel.js";
import Setting from "./setting.js";
import User from "./user.js";
*/

switch (dbConfig.DBType) {
	case 'mysql':
		var options = {
			dialect: 'mysql',
			host: dbConfig.DBHost
		};
		var DB = new Sequelize(dbConfig.DBFile, dbConfig.DBUsername, dbConfig.DBPassword, options);
		break;
	case 'sqlite':
		var options = {
			dialect: 'sqlite',
			storage: dbConfig.DBFile
		};
		var DB = new Sequelize('', '', '', options);
		break;
	default:
		throw new Error("Unrecognised DB type");
}
DB.authenticate();
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