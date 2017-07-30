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
				log.info("Got valid Token response, looking up user and channel info");
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
				}).then(([user, channel]) => {
					log.info("Got infos. Finding or creating user");
					log.debug("User", user);
					log.debug("Channel", channel);
					req.session.displayName = user.display_name;
					req.session.logo = user.logo;
					DB.models.User.findOrCreate({
						where: {
							userID: response.token.userID
						}, defaults: {
							userID: response.token.userID
						}
					}).spread((userObj, created) => {
						req.session.user = userObj;
						userObj.userID = response.token.userID;
						userObj.userName = user.name;
						userObj.displayName = user.display_name;
						userObj.logo = user.logo;
						userObj.bio = user.bio;
						userObj.token = req.session.token.client_id;
						userObj.save().then((userObj) => {
							req.session.user = userObj;
							DB.models.Channel.findOrCreate({
								where: {
									UserId: userObj.id
								}, defaults: {
									UserID: userObj.id
								}
							}).spread((chanObj, created) => {
								chanObj.name = channel.name;
								chanObj.broadcasterLanguage = channel.broadcaster_language;
								chanObj.displayName = channel.display_name;
								chanObj.followers = channel.followers;
								chanObj.game = channel.game;
								chanObj.language = channel.language;
								chanObj.logo = channel.logo;
								chanObj.mature = channel.mature;
								chanObj.partner = channel.partner;
								chanObj.profileBanner = channel.profile_banner;
								chanObj.profileBannerBackgroundColor = channel.profile_banner_background_color;
								chanObj.status = channel.status;
								chanObj.url = channel.url;
								chanObj.videoBanner = channel.video_banner;
								chanObj.views = channel.views;
								chanObj.twitchCreatedAt = channel.created_at;
								chanObj.twitchUpdatedAt = channel.updated_at;
								chanObj.save().then((chanObj) => {
									req.session.channel = chanObj;
									req.session.profileBanner = channel.profile_banner;
									req.session.profileBannerBackgroundColor = channel.profile_banner_background_color;
									res.redirect("/");
								});
							});

						}).catch((err) => {
							log.warn("Problem saving...", err);
						});
					}).catch((err) => {
						log.warn("Well, that didn't work...", err);
					});
				}).catch((err) => {
					log.warn("Couldn't find or create...", err);
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
