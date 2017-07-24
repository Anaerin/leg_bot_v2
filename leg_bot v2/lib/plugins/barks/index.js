"use strict";
// Incomplete. Placeholder for now?

const Plugin = require("../plugin.js");
const Sequelize = require("sequelize");
const Model = Sequelize.Model;
const DataType = Sequelize.DataTypes;

class Bark extends Model {
	constructor() {
		super();
	}
	static init(sequelize) {
		super.init({
			id: {
				type: DataType.INTEGER,
				primaryKey: true
			},
			command: {
				type: DataType.STRING(32),
				allowNull: false,
				validate: {
					isAlpha: true
				}
			},
			message: DataType.STRING(500),
			modsOnly: {
				type: DataType.BOOLEAN,
				defaultValue: true
			},
			interval: {
				type: DataType.INTEGER,
				defaultValue: 0,
				validate: {
					isInt: true
				}
			}
		}, { sequelize, timestamps: false });

	}
	static relation(models) {
		this.belongsTo(models.Channel);
	}
}

class Barks extends Plugin {
	constructor(client, channel) {
		super(client, channel);
	}
	static get description() {
		return "Allows simple responses to in-chat queries, or timed repeating of static messages";
	}
	static get name() {
		return "Barks";
	}
	static get configuration() {
		return [
			{
				name: "Active",
				type: "Boolean",
				default: true
			}, 
			{
				name: "Barks",
				type: "Callback",
				callback: "EditBarks"
			}
		];
	}
	static initDatabase(DB) {
		Bark.init(DB);
		Bark.relation(DB.models);
		//var bark = new Bark();		
	}
	EditBarks() {
		
	}
}
module.exports = Barks;