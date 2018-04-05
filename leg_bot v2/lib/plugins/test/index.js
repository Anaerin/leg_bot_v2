"use strict";
// Incomplete. Placeholder for now?
const log = require("../../log");
const Plugin = require("../plugin.js");
const express = require("express");
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
	static get webMenu() {
		return [{
			name: "Test",
			url: "/test"
		}];
	}
	static get webPages() {
		let mw = new express.Router({
			mergeParams: true
		});
		mw.get("/$", (req, res) => {
			res.locals.subMenu = [{
				name: "Test",
				url: "/test/test"
			}];
			res.render("main", {
				title: "Test page",
				content: "Testing things here. This means the plugin... works?",
			});
		});
		mw.get("/test$", (req, res) => {
			res.locals.subMenu = [{
				name: "Test",
				url: "/test/test"
			}];
			res.render("main", {
				title: "Test Sub Page",
				content: "Testing more things, don't mind me.",
			});
		});
		return mw;
	}
}
module.exports = Test;