'use strict';
import { Model, DataType } from 'sequelize';
import User from "./user.js";
import Setting from "./setting.js";

export default class Channel extends Model {
	constructor() {
		super();
		this.lastCheckedLive = 0;
	}
	static init(sequelize) {
		super.init({
			timestamps: false,
			id: DataType.INTEGER,
			name: DataType.STRING,
			active: DataType.STRING
		}, { sequelize });
		this.belongsTo(User);
		this.hasMany(Setting);
	}
}