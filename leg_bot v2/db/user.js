'use strict';
import { Model, DataType } from 'sequelize';
import Channel from "./channel.js";

export default class User extends Model {
	constructor() {
		super();
	}	
	static init(sequelize) {
		super.init({
			timestamps: false,
			id: DataType.INTEGER,
			name: DataType.STRING,
			token: DataType.STRING,
			lastSeen: DataType.DATE(6)
		}, { sequelize });
		this.hasOne(Channel, { as: "lastSeenChannel" });
	}
}