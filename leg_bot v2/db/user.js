'use strict';
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
import Channel from "./channel.js";
*/

var Channel = require("./channel.js");

module.exports = class User extends Model {
	constructor() {
		super();
	}
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			userID: DataType.STRING,
			userName: DataType.STRING,
			displayName: DataType.STRING,
			logo: DataType.STRING,
			token: DataType.STRING,
			bio: DataType.STRING,
			lastSeen: DataType.DATE,
			scopes: DataType.STRING
		}, { sequelize, timestamps: false });
		//this.hasOne(Channel, { as: "lastSeenChannel" });
	}
	static relation(models) {
		this.hasOne(models.Channel);
		this.hasOne(models.Channel, { as: "lastSeenChannel" });
	}
};