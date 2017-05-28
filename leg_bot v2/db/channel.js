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
			timestamps: false,
			id: {
				type: DataType.INTEGER,
				primaryKey: true
			},
			name: DataType.STRING,
			active: DataType.STRING
		}, { sequelize });
		//this.belongsTo(User);
		//this.hasMany(Setting);
	}
	static relation(models) {
		this.belongsTo(models.User);
	}
}