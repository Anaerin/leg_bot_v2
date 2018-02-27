"use strict";
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
import Channel from './channel.js';
*/

module.exports = class UserHistory extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			timeChanged: DataType.DATE,
			oldUserName: DataType.STRING
		}, { sequelize, timestamps: false });
		//this.hasOne(Channel);
	}
	static relation(models) {
		this.belongsTo(models.User);
	}
};