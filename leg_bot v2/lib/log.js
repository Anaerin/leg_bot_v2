'use strict';
import winston from 'winston';
class Logger extends winston.Logger {
	constructor() {
		super();
		this.transports = [
			new winston.transports.Console({ json: false, timestamp: true }),
			new winston.transports.File({
				filename: __dirname + "/debug.log",
				json: false
			});
		];
		this.exitOnError = false;
	}
}
var log = new Logger();
export default log;
