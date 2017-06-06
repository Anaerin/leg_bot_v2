"use strict";
// And this is where the web interface goes.
const express = require("express");
const log = require("../lib/log.js");

//const mmm = require("mmm");
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

app.use((req, res, next) => {
	if (req.session.loggedIn) {
		res.locals.loggedIn = true;
		res.locals.userName = req.session.userName;
		res.locals.displayName = req.session.displayName;
		res.locals.logo = req.session.logo;
		res.locals.menu = [
			{ name: "Home", url: "/" },
			{ name: "Channel", url: "/channel" },
			{ name: "Logout", url: "/logout" }
		];
	} else {
		res.locals.loggedIn = false;
		res.locals.menu = [
			{ name: "Home", url: "/" },
			{ name: "Login", url: "/login" }
		];
	}
	return next();
});

app.use('/', require("./pages"));

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