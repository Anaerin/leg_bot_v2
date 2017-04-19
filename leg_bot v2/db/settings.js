'use strict';
import { Model, DataType } from 'sequelize';
import Channel from './channel.js';

export default class Settings extends Model {
	static init(sequelize) {
		super.init({
			timestamps: false,
			name: DataType.STRING,
			value: DataType.STRING
		}, { sequelize });
	}
}
