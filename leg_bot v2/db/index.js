var Sequelize = require("sequelize");
var sql = new Sequelize('leg_bot', null, null, { dialect: 'sqlite', storage: 'legbot.sqlite' });

var User = sql.define("user", {
	username: {
		type: Sequelize.STRING,
		allowNull: false
	},
	twitchToken: {
		type: Sequelize.STRING,
		allowNull: true
	}
});

var Channel = sql.define("channel", {
	channelname: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

var ChannelUser = sql.define("channelUser", {
	isModerator: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		default: false
	}
});

Channel.belongsTo(User, { as: "Owner" });
Channel.belongsToMany(User, { as: "Users", through: ChannelUsers });

var Plugin = sql.define("plugins", {
	active: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		default: false
	},
	type: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

Channel.hasMany(Plugin);

var Config = sql.define("configuration", {
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	value: {
		type: Sequelize.STRING,
		allowNull: false
	}
});

Channel.hasMany(Config);
Plugin.hasMany(Config);