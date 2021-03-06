"use strict";
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
import Channel from './channel.js';
*/

module.exports = class Setting extends Model {
	static init(sequelize) {
		super.init({
			name: DataType.STRING,
			value: DataType.STRING
		}, { sequelize, timestamps: false });
	}
	static relation(models) {
		this.belongsTo(models.User);
	}
};