"use strict";
const express = require("express");
const log = require("../../lib/log.js");
const Plugins = require("../../lib/plugins");
const Auth = require("../authentication.js");
const querystring = require("querystring");

let app = module.exports = new express.Router({
	mergeParams: true
});

app.get("/$", async (req, res, next) => {
	log.debug("User accessing channels page. Checking auth");
	try {
		await Auth.isAuthenticated(req.session);
		log.debug("Auth is AOK, moving on...");
		return next();
	} catch (err) {
		if (err.login) res.redirect("/login?to=" + querystring.escape(req.originalUrl));
		else res.render("main", {
			title: "Error",
			content: "An error occurred checking authentication. Please inform Anaerin" + err.error
		});
	}
});

app.get("/$", async (req, res) => {
	log.debug("Rendering page.");
	let configurations = Plugins.configuration;
	let user = req.session.user;
	let userSettings = await user.getSettings();
	let settings = {};
	userSettings.forEach((setting) => {
		settings[setting] = userSettings[setting];
	});
	res.render("main", {
		title: "Channel Control",
		content: "Nothing here yet.",
		plugin: configurations,
		settings: settings
	});
	// User is logged in, token is valid, all that jazz...
});