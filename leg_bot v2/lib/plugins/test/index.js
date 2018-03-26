"use strict";
// Incomplete. Placeholder for now?
const log = require("../../log");
const Plugin = require("../plugin.js");
class Test extends Plugin {
	constructor(channel) {
		super(channel);
		log.debug("Binding to command %s", "Command test");
		channel.on("Command test", this.onCommand.bind(this));
	}
	static get description() {
		return "Test plugin, just making sure things work";
	}
	static get name() {
		return "Test";
	}
	async onCommand(userState, message) {
		let displayName = userState["display-name"];
		if (!displayName) displayName = userState["username"];
		this.channel.say("I see you, " + displayName + ". Hello! You said " + message);
		//this.channel.say("Test received!");
	}
}
module.exports = Test;