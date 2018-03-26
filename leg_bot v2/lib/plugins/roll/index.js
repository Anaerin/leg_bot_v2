"use strict";
// Incomplete. Placeholder for now?
const log = require("../../log");
const Plugin = require("../plugin.js");
const roll = require("roll");
const util = require("util");
class Roll extends Plugin {
	constructor(channel) {
		super(channel);
		channel.on("Command roll", this.onCommand.bind(this));
	}
	static get description() {
		return "Rolls dice";
	}
	static get name() {
		return "Roll";
	}
	async onCommand(userState, message) {
		let displayName = userState["display-name"];
		if (!displayName) displayName = userState["username"];
		let messagePieces = message.split(" ");
		if (messagePieces.length > 0) {
			let diceToRoll = messagePieces[1];
			let roller = new roll();
			if (roller.validate(diceToRoll)) {
				let diceRoll = roller.roll(diceToRoll);
				this.channel.say(util.format("Rolled %s, and got %s (%s)", diceToRoll, diceRoll.result, JSON.stringify(diceRoll.rolled)));
			} else {
				this.channel.say(util.format("Sorry, but %s is not a valid die roll", diceToRoll));
			}
		} else {
			this.channel.say("Please enter a type of die to roll (for example, 2d20+5)");
		}
	}
}
module.exports = Roll;