"use strict";
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
*/

module.exports = class AntiSpam extends Model {
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				primaryKey: true
			},
			name: DataType.STRING,
			regularExpression: DataType.STRING,
			count: DataType.INTEGER.ZEROFILL.UNSIGNED
		}, { sequelize, timestamps: false });
	}
	/* static relation(models) {
	} */
};