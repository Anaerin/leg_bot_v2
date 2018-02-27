"use strict";
// Global variables for the includes, that instantiate themselves!
// Makes esLint cry, though.
var DB = require("./db/index.js");
var client = require("./tmi/client.js");
var log = require("./lib/log.js");
var server = require("./web/index.js");
log.warn("I bet you were expecting something more here... Sorry.");
