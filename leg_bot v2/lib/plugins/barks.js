var Plugin = require("../plugin.js");

class Barks extends Plugin {
	constructor(client) {
		super(client);
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
	EditBarks() {

	}
}

module.exports = Barks;