"use strict";
var log = require("./log.js");
var DB = require("../db/index.js");
//var AntiSpam = require("../db/antispam.js");
var AntiSpam = DB.models.AntiSpam;

/*
Node doesn't support ES6 imports.
import log from "./log.js";
import AntiSpam from "../db/antispam.js";
*/

// We're a singleton! We don't want or need multiple instancing. Hear us roar?

class Message {
	constructor(userstate, channel, message) {
		this.user = userstate["user-id"];
		this.username = userstate.username;
		this.userstate = userstate;
		this.channel = channel;
		this.message = message;
		this.instantiated = Date.now();
	}
}

class AntiSpamEngine {
	constructor() {
		this.rules = [];
		this.userTimeouts = new Map();
		this.updateRules();
		this.messageHistory = [];
		this.historyPrune = setInterval(() => {
			// Every 5 seconds, While there are messages that are more than 5 seconds old...
			while (this.messageHistory.length > 0 && this.messageHistory[0].instantiated > (Date.now() + 5000)) {
				// Shift it off the top of the stack.
				this.messageHistory.shift();
			}
		}, 5000);
		this.timeoutCountdown = setInterval(() => {
			// Every minute, tick down the timeout factor once for users that have one.
			this.userTimeouts.forEach((user) => {
				if (user > 0) user--;
			});
		},60000);
	}
	alreadySaid(userstate, channel, message) {
		let alreadySaid = false;
		let timesSaid = this.messageHistory.reduce((found, value) => {
			// If the message has been said before, less than 5 seconds ago, increment our pass-through counter.
			if (value.message == message && value.instantiated < (Date.now() + 5000)) found++;
			return found;
		}, 0);
		if (timesSaid > 3) {
			log.debug("Antispam: Duplicate message, from %s (%s), in channel %s, repeated %s times, saying %s",userstate["user-id"], userstate.username, channel, timesSaid, message);
			alreadySaid = true;
		}
		// Make a new message and push it on the bottom of the stack.
		this.messageHistory.push(new Message(userstate, channel, message));
		return alreadySaid;
	}
	updateRules() {
		AntiSpam.findAll().then(rules => {
			this.rules = rules;
			this.rules.forEach((rule) => {
				rule.regEx = new RegExp(rule.regularExpression, "i");
			});
		});
	}
	removeRule(name) {
		AntiSpam.destroy({ where: { name: name } }).then(() => {
			this.updateRules();
		});
	}
	addRule(name, regEx) {
		let matches = this.rules.filter(rule => rule.name == name);
		if (Array.isArray(matches) && matches.length > 0) {
			return false;
		} else {
			AntiSpam.create({ name: name, regularExpression: regEx, count: 0 }).then(this.updateRules());
			return true;
		}
	}
	matchRule(text) {
		let matches = this.rules.filter((rule) => rule.regEx.test(text));
		if (Array.isArray(matches) && matches.length > 0) {
			matches[0].increment(["count"], {by: 1}).then((match) => {
				match.reload();
			});
			return matches[0];
		} else {
			return false;
		}
	}
	listRules() {
		let ruleNames = [];
		this.rules.forEach(rule => {
			if (rule.count == 1) {
				ruleNames.push(rule.name + " (matched " + rule.count + " time");
			} else {
				ruleNames.push(rule.name + " (matched " + rule.count + " times");
			}
		});
		return ruleNames;
	}
}
var antiSpam = new AntiSpamEngine();
module.exports = antiSpam;