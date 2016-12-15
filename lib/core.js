'use strict';
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const DBAdapterInterface = require('periodicjs.core.data');
const ResponderAdapterInterface = require('periodicjs.core.responder');
const ProtocolAdapterInterface = require('periodicjs.core.protocols');
const Utilities = require('periodicjs.core.utilities');
const express = require('express');
const UTILITY = require(path.join(__dirname, '../utility/index'));

var periodic_resources;
var logger;
var application_settings;
var initialization_options;
var appenvironment;
var applocals;
var CoreUtilities;
var theme;
var _logError;
var _logWarning;

const _INITIALIZE_UTILITY_RESPONDER = function () {
	Object.defineProperty(this, '_utility_responder', {
		writable: false,
		value: ResponderAdapterInterface.create({ adapter: 'html', themename: theme }),
		configurable: false,
		enumerable: false
	});
};

const _INITIALIZE_ALIASED_UTILITIES = function () {
	let aliased = Object.assign({}, UTILITY.middleware, UTILITY.aliased);
	for (let key in aliased) {
		this[key] = aliased[key].call(this);
	}
};

const _STARTUP = function (options) {
	if (!options.meta) {
		Object.defineProperty(this, 'meta', {
			writable: false,
			value: new Proxy({}, UTILITY.traps(this)),
			configurable: false,
			enumerable: false
		});
	}
	if (!options.skip_responder) this.initialize_responder(options);
	if (!options.skip_db) this.initialize_db(options);
	if (!options.skip_protocol) this.initialize_protocol(options);
	_INITIALIZE_UTILITY_RESPONDER.call(this);
	_INITIALIZE_ALIASED_UTILITIES.call(this);
	return this;
};

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
		return _STARTUP.call(this, options);
	}
	initialize_responder (options = {}) {
		this.responder = (options.responder_configuration) ? ResponderAdapterInterface.create(options.responder_configuration) : ResponderAdapterInterface.create({ adapter: 'json' });
		return this;
	}
	initialize_protocol (options = {}) {
		let protocolOptions = Object.assign({
			responder: this.responder,
			db: this.db,
			settings: Object.assign({}, application_settings),
			logger,
			resources: periodic_resources,
			api: 'rest',
			adapter: 'http',
			express
		}, options.protocol_configuration || {});
		this.protocol = ProtocolAdapterInterface.create(protocolOptions);
		return this;
	}
	initialize_db (options = {}) {
		this.db = (this.db && typeof this.db === 'object') ? this.db : {};
		if (options.db_configuration) {
			if (Array.isArray(options.db_configuration)) {
				options.db_configuration.forEach(configuration => {
					this.db[configuration.model_name] = DBAdapterInterface.create(configuration);
				});
			}
			else this.db[options.db_configuration.model_name] = DBAdapterInterface.create(options.db_configuration);
		}
		if (!this.db.default) this.db.default = DBAdapterInterface.create({ adapter: 'mongo' });
		return this;
	}
};

module.exports = CORE;
