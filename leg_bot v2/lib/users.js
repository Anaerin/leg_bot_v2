'use strict';
import Sequelize from "sequelize";
import User from "../db/user.js";

class Users {
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
}