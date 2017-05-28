'use strict';
/*
Node doesn't support ES6 imports.
import winston from 'winston';
*/

var winston = require("winston");
require("winston-daily-rotate-file");

/* This is supposed to work, but I can't find documentation for it anywhere.
Using the ES5 version until I can figure out how this is supposed to work.

class Logger extends winston.Logger {
	constructor() {
		super();
		this.transports = [
			new (winston.transports.Console)({ json: false, timestamp: true }),
			new (winston.transports.File)({
				filename: __dirname + "../logs/debug.log",
				json: false
			})
		];
		this.exceptionHandlers = [
			new (winston.transports.Console)({ json: false, timestamp: true }),
			new (winston.transports.File)({
				filename: __dirname + "../logs/debug.log",
				json: false
			})
		]
		this.exitOnError = false;
	}
}
var log = new Logger();
module.exports = log;
*/

var log = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			colorize: true,
			json: false,
			timestamp: true,
			level: "debug"
		}),
		new (winston.transports.DailyRotateFile)({
			filename: 'logs/debug.log',
			datePattern: 'yyyy-MM-dd.',
			prepend: true
		})
	]
});
module.exports = log;