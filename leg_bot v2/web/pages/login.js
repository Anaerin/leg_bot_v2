"use strict";
const Twitch = require("../../lib/Twitch.js");
const log = require("../../lib/log.js");
const express = require("express");
const crypto = require("crypto");

function mathRandom() {
	let buf = crypto.randomBytes(4).toString("hex");
	return parseInt(buf, 16) / Math.pow(2, 32);
}

let app = module.exports = new express.Router({
	mergeParams: true
});
app.get("/$", (req, res) => {
	let lastPage = req.query.to;
	if (lastPage) req.session.returnURL = lastPage;
	log.debug("Logging in user, returning them to %s", lastPage);
	// Make sure something is set in the session, so it saves.
	req.session.loggingIn = true;
	let nonce = "";
	let state = "";
	let mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	for (let i = 0; i < 16; i++) {
		nonce += mask.charAt(parseInt(mathRandom() * mask.length, 10));
		state += mask.charAt(parseInt(mathRandom() * mask.length, 10));
	}
	req.session.nonce = nonce;
	req.session.state = state;

	res.redirect(Twitch.tokenURL(["openid"], req.session.state, req.session.nonce));
});