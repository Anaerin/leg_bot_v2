'use strict';
const Twitch = require("../../lib/Twitch.js");
const log = require("../../lib/log.js");
const express = require("express");
const DB = require("../../db");

let app = module.exports = new express.Router({ mergeParams: true });

function processUser(user) {
	log.info("Got user details", user);
	DB.model("User").findOrCreate({
		where: {
			userID: req.session.userID
		}, defaults: {
			userID: req.session.userID
		}
	}).spread((founduser, created) => {
		founduser.userName = req.session.userName;
		founduser.displayName = user.display_name;
		if (user.logo) founduser.logo = user.logo;
		founduser.bio = user.bio;
		founduser.token = req.session.token;
		founduser.save();
	});
	req.session.displayName = user.display_name;
	req.session.logo = user.logo || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png";
	req.session.save();
}

function processChannel(channel) {
	log.info("Got Channel", channel);
	DB.model("Channel").findOrCreate({
		where: {
			userId: req.session.userID
		}, defaults: {
			userId: req.session.userID
		}
	}).spread((foundChannel, created) => {
		if (!created && foundChannel.name != channel.name) {
			foundChannel.name = channel.name;
			foundChannel.save();
		}
	});
}

app.get("/$", (req, res) => {
	let twitchAuth = req.query.code;
	let twitchState = req.query.state;
	if (req.session.id === req.query.state) {
		Twitch.completeToken(twitchAuth, twitchState).then((response) => {
			if (response.valid) {
				req.session.token = response.token;
				req.session.loggedIn = true;
				req.session.userName = response.token.userName;
				req.session.userID = response.token.userID;
				let p = Promise.all(
					Twitch.getUserByID(req.session.userID).then(processUser),
					Twitch.getChannelById(req.session.userID).then(processChannel)
				).catch((err) => {
					res.status(500);
					res.render("main", {
						title: "Error",
						content: "An error occurred fetching user details - <pre>" + JSON.stringify + "</pre>"
					});
				});
				
			} else {
				res.status(500);
				res.render("main", {
					title: "Error",
					content: "An error occurred - oAuth Token is invalid. Please inform Anaerin."
				});
			}
		}).catch((err) => {
			res.status(500);
			res.render("main", {
				title: "Error",
				content: "An error occurred - oAuth Token is invalid. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	} else if (req.query.state === "TMILogin") {
		Twitch.completeToken(twitchAuth, twitchState).then((token, valid) => {
			res.redirect("/");
		}).catch((err) => {
			res.render('main', {
				title: "Error",
				content: "An error occurred while logging in. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	} else {
		//This token is for someone else?
		log.warn("Got token for %s, but session ID is for %s... Mismatch?", req.query.state, req.session.id);
		res.redirect("/");
	}
});
