'use strict';
const express = require("express");
const querystring = require("querystring");
const log = require("../../lib/log.js");
const Plugins = require("../../lib/plugins");

let app = module.exports = new express.Router({ mergeParams: true });
app.get("/$", (req, res) => {
	if (req.session.loggedIn) {
		res.render("main", {
			title: "Edit Channel",
			content: "Here is where you would edit your channel."
		});
	} else {
		res.redirect("/login?to=" + querystring.escape(req.originalUrl));
	}	
});