'use strict';
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const DBAdapterInterface = require('periodicjs.core.data');
const ResponderAdapterInterface = require('periodicjs.core.responder');
const ProtocolAdapterInterface = require('periodicjs.core.protocols');
const Utilities = require('periodicjs.core.utilities');
const express = require('express');

var periodic_resources;
var logger;
var application_settings;
var initialization_options;
var appenvironment;
var applocals;
var CoreUtilities;
var theme;

const CORE = class Core {
	constructor (resources, options = {}) {
		periodic_resources = resources;
		logger = resources.logger;
		application_settings = resources.settings;
		theme = resources.settings.theme;
		appenvironment = application_settings.application.environment;
		if (periodic_resources.app && periodic_resources.app.locals) applocals = periodic_resources.app.locals;
		CoreUtilities = new Utilities(resources);
		this.responder = null;
		this.protocol = null;
		this.db = null;
		return this._startup(options);
	}
	initialize_responder (options = {}) {
		this.responder = (options.responder_configuration) ? ResponderAdapterInterface.create(options.responder_configuration) : ResponderAdapterInterface.create({ adapter: 'json' });
		return this;
	}
	initialize_protocol (options = {}) {
		let protocolOptions = Object.assign({
			responder: this.responder,
			db: this.db,
			settings: Object.assign({}, application_settings, theme),
			logger,
			resources: periodic_resources,
			api: 'rest',
			adapter: 'http'
			express
		}, options.protocol_configuration || {});
		this.protocol = ProtocolAdapterInterface.create(protocolOptions);
		return this;
	}
	initialize_db (options = {}) {
		if (options.db_configuration) {
			if (Array.isArray(options.db_configuration)) {
				options.db_configuration.forEach(configuration => {
					this.db = (this.db && typeof this.db === 'object') ? this.db : {};
					this.db[configuration.model_name] = DBAdapterInterface.create(configuration);
				});
			}
			else this.db[options.db_configuration.model_name] = DBAdapterInterface.create(options.db_configuration);
		}
		else if (!options.db_configuration && !this.db) this.db = { default: DBAdapterInterface.create({ adapter: 'mongo' }); }
		return this;
	}
	_startup (options = {}) {
		if (!options.skip_responder) this.initialize_responder(options);
		if (!optons.skip_protocol) this.initialize_protocol(options);
		if (!options.skip_db) this.initialize_db(options);
		return this;
	}
};

module.exports = CORE;

// var get = function (target, property) {
// 	let direct = ['protocol', 'db', 'responder', 'initialize', 'initialize_responder', 'initialize_protocol', 'initialize_db'];
// 	if (direct.indexOf(property) !== -1) return (typeof target[property] === 'function') ? target[property].bind(target) : target[property];
// 	else {
// 		let sources = [];
// 		if (!this.protocol) logger.warn('protocol adapter has not been initialized');
// 		else sources.push(this.protocol);
// 		if (!this.db) logger.warn('db adapter has not been initialized');
// 		if(!this.responder) logger.warn('response adapter has not been initialized');
// 		else sources.push(this.responder);
// 		sources.push(this);
// 		for (let i = 0, len = sources.length; i < len; i++) {
// 			if (sources[i][property]) return (typeof sources[i][property] === 'function') ? sources[i][property].bind(sources[i]) : sources[i][property];
// 		}
// 		if (this.db && this.db === 'object') {
// 			if (this.db.default[property]) return (typeof this.db.default[property] === 'function') ? this.db.default[property].bind(this.db.default) : this.db.default[property];
// 		}
// 		return undefined;
// 	}
// };

// var set = function (target, property, value) {
// 	let inaccessible = ['protocol', 'db', 'responder'];
// 	if (inaccessible.indexOf(property) !== -1) return false;
// 	target[property] = value;
// 	return true;
// };

// module.exports = function core (resources, options = {}) {
// 	return new Proxy(new CORE(resources, options), { get, set });
// };
