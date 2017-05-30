"use strict";
// And this is where the web interface goes.
const express = require("express");
const log = require("../lib/log.js");
const path = require("path");
const mmm = require("mmm");
const Twitch = require("../lib/Twitch.js");
const session = require("express-session");
const DB = require("../db/index.js");
const secrets = require("../secrets.js");

let app = express();
let SequelizeStore = require("connect-session-sequelize")(session.Store);

app.set('view engine', 'mmm');
app.set('views', __dirname + "/views");
app.set('trust proxy', 1);

app.use(session({
	secret: secrets.sessionSecret,
	store: new SequelizeStore({
		db: DB
	}),
	saveUninitialized: false,
	rolling: true,
	resave: false
}));

app.use((err, req, res, next) => {
	res.status(500);
	res.render("main", {
		title: "Error",
		menu: [
			{ name: "Home", url: "/" },
			{ name: "Login", url: "/login" }
		],
		content: "An error occurred. Please inform Anaerin.\n<br><pre>" + err.stack + "</pre>"
	});
	//return next();
});

app.use((req, res, next) => {
	if (req.session.loggedIn) {
		res.locals.loggedIn = true;
		res.locals.userName = req.session.userName;
	}
	return next();
})

app.use("/css", express.static("web/css"));

app.get("/", (req, res) => {
	res.render("main", {
		title: "Home",
		menu: [
			{ name: "Home", url: "/", active: true },
			{ name: "Login", url: "/login" }
		]
	});
});

app.get("/oAuth", (req, res) => {
	let twitchAuth = req.query.code;
	let twitchState = req.query.state;
	if (req.session.id === req.query.state) {
		Twitch.completeToken(twitchAuth, twitchState).then((response) => {
			if (response.valid) {
				req.session.token = response.token;
				req.session.loggedIn = true;
				req.session.userName = response.token.userName;
				res.redirect(req.session.returnURL || "/");
			} else {
				res.status(500);
				res.render("main", {
					title: "Error",
					menu: [
						{ name: "Home", url: "/" },
						{ name: "Login", url: "/login" }
					],
					content: "An error occurred - oAuth Token is invalid. Please inform Anaerin."
				});
			}
		}).catch((err) => {
			res.status(500);
			res.render("main", {
				title: "Error",
				menu: [
					{ name: "Home", url: "/" },
					{ name: "Login", url: "/login" }
				],
				content: "An error occurred - oAuth Token is invalid. Please inform Anaerin.\n<pre>" + JSON.stringify(err) + "</pre>"
			});
		});
	} else if (req.query.state === "TMILogin") {
		Twitch.completeToken(twitchAuth, twitchState).then((token, valid) => {
			res.redirect("/");
		}).catch((err) => {
			log.warn("Got error...", err);
		});
	} else {
		//This token is for someone else?
		log.warn("Got token for %s, but session ID is for %s... Mismatch?", req.query.state, req.session.id);
	}
});

app.get("/login", (req, res) => {
	let lastPage = req.query.to;
	if (lastPage) req.session.returnURL = req.query.reDirTo;
	res.redirect(Twitch.tokenURL([], req.session.id));
});

app.use((req, res, next) => {
	res.status(404);
	res.render("main", {
		title: "Error",
		menu: [
			{ name: "Home", url: "/" },
			{ name: "Login", url: "/login" }
		],
		content: "Couldn't find page " + req.path
	});
	return next();
});


var server = app.listen(8000, () => {
	var host = server.address().address;
	var port = server.address().port;
	log.info("Server listening at http://%s:%s", host, port);
});
module.exports = server;