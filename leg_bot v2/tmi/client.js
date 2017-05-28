'use strict';
/*
Node doesn't support ES6 imports.
import EventEmitter from 'events';
//import Settings from '../settings.js';
import tmi from 'tmi.js';
import Twitch from '../lib/Twitch.js';
import log from '../lib/log.js';
import antiSpam from "../lib/antispam.js";
*/

var EventEmitter = require("events");
var tmi = require("tmi.js");
var Twitch = require("../lib/Twitch.js");
var log = require("../lib/log.js");
var antiSpam = require("../lib/antispam.js");

class tmiClient extends EventEmitter {
	constructor() {
		super();
		log.info("Constructing tmiClient...");
		if (Twitch.tokenIsValid) {
			log.info("Got token, doing connect");
			this.userName = Twitch.userName;
			this.oAuthToken = Twitch.oAuthToken;
			this.userID = Twitch.userID;
			this.doConnect();
		} else {
			log.info("No token, waiting for event.");
			Twitch.on("GotValidToken", (Args) => {
				this.userName = Args.userName;
				this.oAuthToken = Args.token;
				this.userID = Args.userID;
				this.doConnect();
			});
		}
	}
	doConnect() {
		var options = {
			connection: {
				reconnect: true,
				secure: true
			},
			identity: {
				username: this.userName,
				password: "oauth:" + this.token
			},
			channels: ["#" + this.userName],
			logger: log
		};
		this.client = new tmi.client(options);
		this.client.connect();
	}
	bindEvents() {
		this.client.on("action", this.onAction);
		this.client.on("ban", this.onBan);
		this.client.on("chat", this.onChat);
		this.client.on("cheer", this.onCheer);
		this.client.on("clearchat", this.onClearChat);
		this.client.on("connected", this.onConnected);
		this.client.on("connecting", this.onConnecting);
		this.client.on("disconnected", this.onDisconnected);
		this.client.on("emotesets", this.onEmoteSets);
		this.client.on("hosted", this.onHosted);
		this.client.on("hosting", this.onHosting);
		this.client.on("join", this.onJoin);
		this.client.on("logon", this.onLogon);
		this.client.on("message", this.onMessage);
		this.client.on("mod", this.onMod);
		this.client.on("mods", this.onMods);
		this.client.on("notice", this.onNotice);
		this.client.on("part", this.onPart);
		this.client.on("ping", this.onPing);
		this.client.on("pong", this.onPong);
		this.client.on("reconnect", this.onReconnect);
		this.client.on("resub", this.onResub);
		this.client.on("roomstate", this.onRoomstate);
		this.client.on("serverchange", this.onServerChange);
		this.client.on("subscription", this.onSubscription);
		this.client.on("timeout", this.onTimeout);
		this.client.on("unhost", this.onUnhost);
		this.client.on("unmod", this.onUnmod);
		this.client.on("whisper", this.onWhisper);
	}
	onAction(channel, userstate, message, self) {

	}
	onBan(channel, username, reason) {

	}
	onChat(channel, userstate, message, self) {
		setImmediate(() => {
			//Async processing. Antispam goes here.
			if (!self && !userstate['mod']) {
				// This needs to be overhauled somewhat, but for now, this will do as a placeholder of sorts.
				
				//This user isn't me, and it isn't a mod. Let's see if we have spam...
				let matches = antiSpam.matchRule(message);
				if (matches) {
					//Oh boy! Fresh spam! Let's nuke'em!
					let timeout = 0;
					if (antiSpam.userTimeouts[userstate['user-id']]) timeout = antiSpam.userTimeouts[userstate['user-id']];
					timeout++;
					antiSpam.userTimeouts[userstate['user-id']] = timeout;
					//record the number of times user's been timed out, then use a wonderful exponential scale to calculate how long their timeout is.
					this.client.timeout(channel, userstate.username, Math.pow(4, timeout - 1), "AntiSpam matched rule " + matches.name);
					this.client.say(channel, "Antispam: Timed out " + userstate['display-name'] + " for " + Math.pow(4, timeout - 1) + " seconds (" + matches.name + ")");
					//Finally, add one to this rule's total.
					matches.increment('count', { by: 1 });
				}
			}
		});
	}
	onCheer(channel, userstate, message) {

	}
	onClearChat(channel) {

	}
	onConnected(address, port) {

	}
	onConnecting(address, port) {

	}
	onDisconnected(reason) {

	}
	onEmoteSets(sets, obj) {

	}
	onHosted(channel, username, viewers, autohost) {

	}
	onHosting(channel, target, viewers) {

	}
	onJoin(channel, username, self) {

	}
	onLogon() {

	}
	onMessage(channel, userstate, message, self) {

	}
	onMod(channel, username) {

	}
	onMods(channel, mods) {

	}
	onNotice(channel, msgid, message) {

	}
	onPart(channel, username, self) {

	}
	onPing() {

	}
	onPong(latency) {

	}
	onReconnect() {

	}
	onResub(channel, username, months, message, userstate, methods) {

	}
	onRoomstate(channel, state) {

	}
	onServerChange(channel) {

	}
	onSubscription(channel, username, method, message, userstate) {

	}
	onTimeout(channel, username, reason, duration) {

	}
	onUnhost(channel, viewers) {

	}
	onUnmod(channel, username) {

	}
	onWhisper(from, userstate, message, self) {

	}
}

// We want a singleton, not a new instance of the class each time.
var Client = new tmiClient();
module.exports = Client;