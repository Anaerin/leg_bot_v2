"use strict";
var log = require("./log.js");
var AntiSpam = require("../db/antispam.js");

/*
Node doesn't support ES6 imports.
import log from "./log.js";
import AntiSpam from "../db/antispam.js";
*/

class AntiSpamEngine {
	constructor() {
		this.rules = [];
		this.userTimeouts = Map();
		this.updateRules();
	}
	updateRules() {
		AntiSpam.findAll().then(rules => {
			this.rules = rules;
		});
	}
	removeRule(name) {
		AntiSpam.destroy({ where: { name: name } }).then(() => {
			this.updateRules();
		});
	}
	addRule(name, regEx) {
		let matches = this.rules.filter((rule, index, object) => {
			return rule.name == name;
		});
		if (Array.isArray(matches) && matches.length > 0) {
			return false;
		} else {
			AntiSpam.create({ name: name, regularExpression: regEx }).then(this.updateRules());
			return true;
		}
	}
	matchRule(text) {
		let matches = this.rules.filter((rule, index, object) => {
			try {
				let regEx = new RegExp(rule.regularExpression, "i");
				return regEx.test(text);
			} catch (e) {
				log.info("Error creating RegExp", rule.regularExpression, e);
				return false;
			}
		});
		if (Array.isArray(matches) && matches.length > 0) {
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