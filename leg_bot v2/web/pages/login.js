'use strict';
const Twitch = require("../../lib/Twitch.js");
const log = require("../../lib/log.js");
const express = require("express");

let app = module.exports = new express.Router({ mergeParams: true });
app.get('/$', (req, res) => {
	let lastPage = req.query.to;
	if (lastPage) req.session.returnURL = req.query.to;

	// Make sure something is set in the session, so it saves.
	req.session.loggingIn = true;
	res.redirect(Twitch.tokenURL([], req.session.id));
});