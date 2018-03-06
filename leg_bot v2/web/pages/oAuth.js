"use strict";
const Twitch = require("../../lib/Twitch.js");
const express = require("express");
const Auth = require("../authentication.js");
const log = require("../../lib/log.js");
let app = module.exports = new express.Router({ mergeParams: true });

app.get("/$", (req, res) => {
	if (req.session.state === req.query.state) {
		log.debug("Got Token with matching state. Accepting...");
		Auth.AcceptToken(req, res);
	} else if (req.query.state === "TMILogin") {
		Twitch.completeToken(req.query.code, req.query.state).then((token, valid) => {
			if (valid) { 
				res.redirect("/"); 
			} else {
				res.render("main", {
					title: "Error",
					content: "An error occurred while logging in. Please inform Anaerin\n<pre>Token `" + token + "` not valid</pre>"
				});
			}
		}).catch((err) => {
			res.render("main", {
				title: "Error",
				content: "An error occurred while logging in. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	}
});
