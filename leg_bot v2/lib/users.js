'use strict';
const sequelize = require("sequelize");
const DB = require("../db/index.js");
const User = DB.model.User;

class UsersHandler {
	constructor() {
		this.UserNames = new Map();
		this.UserIDs = new Map();
	}
	getByName(name) {
		if (this.UserNames.has(name)) {
			return this.UserNames.get(name);
		} else {
			User.findOne({ where: { userName: name } }).then(user => {
				this.UserNames.set(user.userName, user);
				this.UserIDs.set(user.userID, user);
				return user;
			}).catch(reason => {
				throw new Error("User does not exist");
			});
		}
	}
	getByID(id) {
		if (this.UserIDs.has(id)) {
			return this.UserIDs.get(id);
		} else {
			User.findOne({ where: { userID: id } }).then(user => {
				this.UserNames.set(user.userName, user);
				this.UserIDs.set(user.userID, user);
				return user;
			}).catch(reason => {
				throw new Error("User does not exist");
			});
		}
	}
	create(userID, userName) {
		User.findOrCreate({ where: { userID: userID, name: userName }, defaults: { userID: userID, name: userName } }).spread((user, created) => {
			this.UserNames.set(user.userName, user);
			this.UserIDs.set(user.userID, user);
			user.save().then(() => {
				return user;
			});
		});
	}
}

const Users = new UsersHandler();
module.exports = Users;