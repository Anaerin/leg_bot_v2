"use strict";
// Incomplete. Placeholder for now?

const Plugin = require("../plugin.js");
const Sequelize = require("sequelize");
const DataType = Sequelize.DataTypes;

class Bark extends Sequelize.Model {
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
		this.belongsTo(models.User);
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
				name: "Barks",
				type: "Custom",
				controlFile: "barkList",
				callback: "EditBarks"
			}
		];
	}
	static initializeDB(DB) {
		Bark.init(DB);
	}
	static setupDBRelations(DB) {
		Bark.relation(DB.models);
	}	
	EditBarks() {
		
	}
}
module.exports = Barks;