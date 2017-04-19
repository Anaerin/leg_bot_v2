'use strict';
import Sequelize from "sequelize";
//var SQL = require("sequelize");
import log from "lib/log.js";
//var log = require("./log.js");
import config from "../config.js";
//var config = require("../config.js");

let logFilter = function (logLine) {
	logLine = logLine + "";

	if (logLine.match(/SELECT/) || logLine.match(/PRAGMA/) || logLine.match(/CREATE/) || logLine.match(/START TRANSACTION/) || logLine.match(/SET/) || logLine.match(/COMMIT/) || logLine.match(/INSERT/) || logLine.match(/DELETE/)) {
		log.debug(logLine);
	}
	else {
		log.info(logLine);
	}
};

switch (config.DBType) {
	case 'mysql':
		var options = {
			dialect: 'mysql',
			host: config.DBHost,
			logging: logFilter
		}
		const sequelize = module.exports.sequelize = new Sequelize(config.DBName, config.DBUsername, config.DBPassword, options);
		break;
	default:
		var options = {
			dialect: 'sqlite',
			storage: config.DBFile,
			logging: logFilter
		}
		const sequelize = module.exports.sequelize = new Sequelize('', '', '', options);
		break;
};

Sequelize.authenticate();
export default sequelize;
