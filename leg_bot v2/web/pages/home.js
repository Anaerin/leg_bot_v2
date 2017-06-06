'use strict';
const express = require("express");
let app = module.exports = new express.Router({ mergeParams: true });
app.get("/$", (req, res) => {
	res.render("main", {
		title: "Home",
	});
});
