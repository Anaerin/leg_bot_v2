'use strict';
const Twitch = require("../../lib/Twitch.js");
const log = require("../../lib/log.js");
const express = require("express");
const DB = require("../../db");

let app = module.exports = new express.Router({ mergeParams: true });

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
				// Asynchronous programming! Get the User info and Channel info by ID.
				Promise.all([
					Twitch.getUserByID(req.session.userID),
					Twitch.getChannelById(req.session.userID)
				]).catch((err) => {
					res.status(500);
					res.render("main", {
						title: "Error",
						content: "An error occurred fetching user details - <pre>" + JSON.stringify(err) + "</pre>"
					});
				}).then(({ user, channel }) => {
					DB.model("User").findOrCreate({
						where: {
							userID: req.session.userID
						},
						include: [
							DB.model("User")
						],
						defaults: {
							userID: req.session.userID
						}
					}).spread((userObj, created) => {
						userObj.update({
							userName: req.session.userName,
							displayName: user.display_name,
							logo: user.logo,
							bio: user.bio,
							token: req.session.token,
							Channel: {
								name: channel.name,
								broadcasterLanguage: channel.broadcaster_language,
								displayName: channel.display_name,
								followers: channel.followers,
								game: channel.game,
								language: channel.language,
								logo: channel.logo,
								mature: channel.mature,
								partner: channel.partner,
								profileBanner: channel.profile_banner,
								profileBannerBackgroundColor: channel.profile_banner_background_color,
								status: channel.status,
								url: channel.url,
								videoBanner: channel.video_banner,
								views: channel.views,
								twitchCreatedAt: channel.created_at,
								twitchUpdatedAt: channel.updated_at
							}
						}).then(() => {
							res.redirect("/");
						});

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
