'use strict';
import EventEmitter from 'events';
import Settings from '../settings.js';
import tmi from 'tmi.js';
import oAuth from '/lib/oAuth.js';
class Client extends EventEmitter {
	constructor() {
		super();
		
		oAuth.getToken();
	}
}