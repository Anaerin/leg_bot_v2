'use strict';
/*
Node doesn't support ES6 imports.
import winston from 'winston';
*/

var winston = require("winston");

class Logger extends winston.Logger {
	constructor() {
		super();
		this.transports = [
			new winston.transports.Console({ json: false, timestamp: true }),
			new winston.transports.File({
				filename: __dirname + "/debug.log",
				json: false
			})
		];
		this.exitOnError = false;
	}
}
var log = new Logger();
module.exports = log;
