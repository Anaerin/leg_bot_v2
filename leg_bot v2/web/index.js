"use strict";
// And this is where the web interface goes.
const express = require("express");
const log = require("../lib/log.js");

//const mmm = require("mmm");
const session = require("express-session");
const DB = require("../db/index.js");
const secrets = require("../secrets.js");
const path = require("path");
const plugins = require("../lib/plugins");
const Twitch = require("../lib/Twitch");

let app = express();
let SequelizeStore = require("connect-session-sequelize")(session.Store);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.set("trust proxy", 1);

app.use(session({
	secret: secrets.sessionSecret,
	store: new SequelizeStore({
		db: DB
	}),
	saveUninitialized: false,
	rolling: true,
	resave: false
}));

app.use(async (req, res, next) => {
	log.debug("Session.loggedIn = %s", req.session.loggedIn);
	if (req.session.loggedIn) {
		// Apparently, sequelize objects don't like being persisted through req.session.
		// So re-create/query it each time. I guess.
		let userID = req.session.user.twitchUserID;
		req.session.user = await Twitch.getUserByID(userID);
		//res.locals.user = req.session.user;
		res.locals.menu = [{
				name: "Home",
				url: "/"
			},
			{
				name: "Channel",
				url: "/channel"
			},
			{
				name: "Logout",
				url: "/logout"
			}
		];
	} else {
		res.locals.loggedIn = false;
		res.locals.menu = [{
				name: "Home",
				url: "/"
			},
			{
				name: "Login",
				url: "/login"
			}
		];
	}
	return next();
});

plugins.forEach((plugin) => {
	if (plugin.webMenu) app.use((req, res, next) => {
		res.locals.menu = res.locals.menu.concat(plugin.webMenu);
		return next();
	});
	if (plugin.webPages) app.use("/" + plugin.name.toLowerCase(), plugin.webPages);
});

app.use("/", require("./pages"));

app.use("/css", express.static("web/css"));

app.use((req, res, next) => {
	res.status(404);
	res.render("main", {
		title: "Error",
		content: "Couldn't find page " + req.path
	});
	return next();
});

app.use((err, req, res, next) => {
	res.status(500);
	res.render("main", {
		title: "Error",
		content: "An error occurred. Please inform Anaerin.\n<br><pre>" + err.stack + "</pre>"
	});
	return next();
});

var server = app.listen(8000, () => {
	var host = server.address().address;
	var port = server.address().port;
	log.info("Server listening at http://%s:%s", host, port);
});
module.exports = server;