"use strict";
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;
var log = require("../lib/log.js");

module.exports = class User extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			// Twitch properties (New API)
			twitchUserID: DataType.STRING,
			userName: DataType.STRING,
			displayName: DataType.STRING,
			description: DataType.STRING,
			offlineImageURL: DataType.STRING,
			profileImageURL: DataType.STRING,
			userType: DataType.STRING,
			viewCount: DataType.INTEGER,
			broadcasterType: DataType.STRING,
			// Internal properties
			lastSeen: DataType.DATE,
			accessToken: DataType.STRING,
			refreshToken: DataType.STRING,
			tokenExpiry: DataType.DATE,
			scopes: DataType.STRING,
			lastQueried: {
				type: DataType.DATE,
				defaultValue: DataType.NOW
			},
			active: {
				type: DataType.BOOLEAN,
				defaultValue: false
			},
			follow: {
				type: DataType.BOOLEAN,
				defaultValue: false
			}
		}, { sequelize, timestamps: false });
	}
	static relation(models) {
		log.debug("Setting User Relations");
		this.belongsTo(models.User, { as: "LastSeenChannel" });
		this.hasMany(models.UserHistory);
		this.hasMany(models.Setting);
	}
};