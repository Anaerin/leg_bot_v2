var EventEmitter = require("events");

class Plugin extends EventEmitter {
	constructor(client) {
		super();
		this.client = client;
	}

	static get name() {
		throw Error("Name is not implemented");
		//return "Plugin name";
	}

	static get description() {
		throw Error("Description is not implemented");
		//return "Description goes here";
	}

	static get configuration() {
		throw Error("Configuration is not implemented");
		//return [];
	}

}

module.exports = Plugin;