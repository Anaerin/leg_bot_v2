"use strict";
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataTypes;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
*/

module.exports = class Session extends Model {
	constructor() {
		super();
	}
	static init(sequelize) {
		super.init({
			sid: {
				type: DataType.STRING,
				primaryKey: true
			},
			userId: DataType.STRING,
			expires: DataType.DATE,
			data: DataType.STRING(50000)
		}, { sequelize, timestamps: false });
	}
	/* static relation(models) {
	} */
};