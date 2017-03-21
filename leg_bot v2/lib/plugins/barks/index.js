import Plugin from "../../plugins";

export default class Barks extends Plugin {
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
	EditBarks() {

	}
}