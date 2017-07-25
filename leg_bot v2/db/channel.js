'use strict';
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
import User from "./user.js";
import Setting from "./setting.js";
*/

var User = require("./user.js");
var Setting = require("./setting.js");

module.exports = class Channel extends Model {
	constructor() {
		super();
		this.lastCheckedLive = 0;
	}
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				autoIncrement: true,
				primaryKey: true
			},
			name: DataType.STRING,
			broadcasterLanguage: DataType.STRING,
			displayName: DataType.STRING,
			followers: DataType.INTEGER,
			game: DataType.STRING,
			language: DataType.STRING,
			logo: DataType.STRING,
			mature: DataType.BOOLEAN,
			partner: DataType.BOOLEAN,
			profileBanner: DataType.STRING,
			profileBannerBackgroundColor: DataType.STRING,
			status: DataType.STRING,
			url: DataType.STRING,
			videoBanner: DataType.STRING,
			views: DataType.INTEGER,
			active: DataType.BOOLEAN,
			follow: DataType.BOOLEAN,
			twitchCreatedAt: DataType.DATE,
			twitchUpdatedAt: DataType.DATE
		}, { sequelize, timestamps: false });
		//this.belongsTo(User);
		//this.hasMany(Setting);
	}
	static relation(models) {
		this.belongsTo(models.User);
	}
};