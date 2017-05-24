'use strict';
var sequelize = require("sequelize");
var Model = sequelize.Model;
var DataType = sequelize.DataType;

/*
Node doesn't support ES6 imports.
import { Model, DataType } from 'sequelize';
import Channel from './channel.js';
*/

var Channel = require("./channel.js");

module.exports = class Setting extends Model {
	static init(sequelize) {
		super.init({
			timestamps: false,
			name: DataType.STRING,
			value: DataType.STRING
		}, { sequelize });
		this.hasOne(Channel);
	}
}