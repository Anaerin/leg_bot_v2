'use strict';
import Sequelize from 'sequelize';
import sequelize from '../db.js';
import Channel from './channel.js';

export default class Settings extends Sequelize.Model { }
Settings.init({
	timestamps: false,
	name: Sequelize.STRING,
	value: Sequelize.STRING
}, { sequelize });