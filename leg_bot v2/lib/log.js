"use strict";
var winston = require("winston");
var isDebug = require("../config.js").debug;
require("winston-daily-rotate-file");

/*
winston.transports.Console.prototype.log = function (level, message, meta, callback) {
	const output = require("winston/lib/winston/common").log(Object.assign({}, this, {
		level,
		message,
		meta
	}));
	console[level in console ? level : "log"](output);
	setImmediate(callback, null, true);
};
*/
var logLevel = "warn";
if (isDebug) logLevel = "debug";
var log = new(winston.Logger)({
	transports: [
		new(winston.transports.Console)({
			colorize: true,
			json: false,
			timestamp: true,
			level: logLevel
		}),
		new(winston.transports.DailyRotateFile)({
			filename: "logs/debug.log",
			datePattern: "yyyy-MM-dd.",
			prepend: true,
			level: logLevel,
			json: false
		})
	]
});
// add callsite info to winston logger instance
function addCallSite(logger) {
	// WARNING: traceCaller is slow
	// http://stackoverflow.com/a/20431861/665507
	// http://stackoverflow.com/a/13411499/665507
	/**
	 * examines the call stack and returns a string indicating
	 * the file and line number of the n'th previous ancestor call.
	 * this works in chrome, and should work in nodejs as well.
	 *
	 * @param n : int (default: n=1) - the number of calls to trace up the
	 *   stack from the current call.  `n=0` gives you your current file/line.
	 *  `n=1` gives the file/line that called you.
	 */
	function traceCaller(n) {
		if (isNaN(n) || n < 0) n = 1;
		var s = (new Error()).stack;
		let stackArray = s.split("\n");
		stackArray.shift();
		let traceLine = stackArray[n + 1].trimLeft();
		traceLine = traceLine.replace(process.cwd(), "");
		traceLine = traceLine.split("(")[1];
		//traceLine = traceLine.substr(1 - traceLine.length);
		if (traceLine.lastIndexOf(":") > 0) traceLine = traceLine.substr(0, traceLine.lastIndexOf(":"));
		else traceLine = traceLine.substr(0, traceLine.lastIndexOf(")"));
		return traceLine;
	}

	// assign to `logger.{level}()`
	for (var func in logger.levels) {
		(function (oldFunc) {
			logger[func] = function () {
				var args = Array.prototype.slice.call(arguments);
				if (typeof args[0] === "string") {
					args[0] = traceCaller(1) + " " + args[0];
				} else {
					args.unshift(traceCaller(1));
				}
				oldFunc.apply(logger, args);
			};
		})(logger[func]);
	}
}

// Tracecaller is slow. Only enable if debug flag is present and set in config.

if (isDebug) addCallSite(log);
module.exports = log;