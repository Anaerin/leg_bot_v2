'use strict';
const express = require("express");

const mw = module.exports = new express.Router({ mergeParams: true });

mw.use('/login', require("./login.js"));
mw.use('/logout', require("./logout.js"));
mw.use('/oAuth', require("./oAuth.js"));
mw.use('/channel', require("./channel.js"));
mw.use('/', require("./home.js"));
