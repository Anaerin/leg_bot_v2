"use strict";
const express = require("express");
let app = module.exports = new express.Router({ mergeParams: true });
app.get("/$", (req, res) => {
	res.locals.title = "Home";
	res.locals.content = "Page goes here.";
	res.render("main");
});
