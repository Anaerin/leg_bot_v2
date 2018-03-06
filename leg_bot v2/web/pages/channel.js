"use strict";
const express = require("express");
const log = require("../../lib/log.js");
//const Plugins = require("../../lib/plugins");
const Auth = require("../authentication.js");
const querystring = require("querystring");

let app = module.exports = new express.Router({ mergeParams: true });

app.get("/$", (req, res, next) => {
	log.debug("User accessing channels page. Checking auth");
	Auth.isAuthenticated(req.session).then(() => {
		log.debug("Auth is AOK, moving on...");
		return next();
	}).catch((err) => {
		if (err.login) res.redirect("/login?to=" + querystring.escape(req.originalUrl));
		else res.render("main", {
			title: "Error",
			content: "An error occurred checking authentication. Please inform Anaerin" + err.error
		});
	});
});

app.get("/$", (req, res) => {
	log.debug("Rendering page.");
	// User is logged in, token is valid, all that jazz...
});
