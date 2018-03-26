// Damn you, Node.js, for not supporting ES6 imports!
module.exports = {
	// DBType: Supported options: 'sqlite', 'mysql'
	DBType: "sqlite",

	// DBHost: Host name of mysql server
	DBHost: "localhost",

	// DBUsername: Login name for mysql server
	DBUsername: "ghost_of_leg_bot",

	// DBPassword: Password for mysql server
	DBPassword: "Sir? Sir! Plain text passwords are bad, M'kay?",

	// DBFile: Location of SQLite3 database
	DBFile: "./legbotv2.sqlite",

	// CommandPrefix: Prefix to listen to for commands
	CommandPrefix: "~",

	// debug: Do tracing for line numbers in the log. WARNING: Slow. Do not enable on release.
	debug: true
};