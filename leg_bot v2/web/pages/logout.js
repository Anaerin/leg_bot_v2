'use strict';
const express = require("express");

let app = module.exports = new express.Router({ mergeParams: true });
app.get('/$', (req, res) => {
	req.session.regenerate((err) => {
		if (err) {
			res.render("main", {
				title: "Error",
				content: "An error occurred regenerating the session. Please inform Anaerin.\n<pre>" + err + "</pre>"
			});
		} else res.redirect("/");
	});
});