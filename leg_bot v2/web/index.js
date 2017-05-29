"use strict";
// And this is where the web interface goes.
var express = require("express");
var log = require("../lib/log.js");
var app = express();


var server = app.listen(8000, () => {
	var host = server.address().address;
	var port = server.address().port;
	log.info("Server listening at http://%s:%s", host, port);
});

module.exports = server;