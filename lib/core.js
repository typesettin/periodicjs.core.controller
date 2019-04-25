'use strict';
const Promisie = require('promisie');
const fs = Promisie.promisifyAll(require('fs-extra'));
const path = require('path');
const DBAdapterInterface = require('periodicjs.core.data');
const ResponderAdapterInterface = require('periodicjs.core.responder');
const ProtocolAdapterInterface = require('periodicjs.core.protocols');
const Utilities = require('periodicjs.core.utilities');
// const COMPATIBILITY = require(path.join(__dirname, '../archive/controller'));
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

/**
 * Initializes a utility HTML responder adapter that is used to render templates if protocol responder is not an HTML adapter and set it to the "_utility_responder" property. This property is not writable, configurable or enumerable
 */
const _INITIALIZE_UTILITY_RESPONDER = function () {
  Object.defineProperty(this, '_utility_responder', {
    writable: false,
    value: ResponderAdapterInterface.create({ adapter: 'html', themename: theme, engine:this.engine, }),
    configurable: false,
    enumerable: false
  });
};

/**
 * Initializes aliased utility methods and set the on "this"
 */
const _INITIALIZE_ALIASED_UTILITIES = function() {
  if (!this.compatibility) {
    let aliased = Object.assign({}, UTILITY.aliased);
    for (let key in aliased) {
      this[key] = aliased[key].call(this);
    }
    for (let key in UTILITY.middleware) {
      this[key] = UTILITY.middleware[key];
    }
  } else {
    for (let key in this.compatibility) {
      this[key] = (typeof this.compatibility[key] === 'function') ? UTILITY.deprecate.call(this.compatibility, this.compatibility[key], `${ key } is deprecated and will soon be removed`) : this.compatibility[key];
    }
  }
};

/**
 * Called a initialization of a "new" CoreController. Implements the "meta" property which grants additional access to child adapter metods through a Proxy. Initialized adapters according to configurations and default adapters
 * @param  {Object} options Configuration options for adapters
 * @param {Boolean} options.skip_responder If true responder adapters will not be initialized
 * @param {Boolean} options.skip_db If true db adapters will not be initialized
 * @param {Booelean} options.skip_protocol If true protocol adapter will not be initialized
 * @return {Object}         "this"
 */
const _STARTUP = function(options) {
  if (!options.meta) {
    Object.defineProperty(this, 'meta', {
      writable: false,
      value: new Proxy({}, UTILITY.traps(this)),
      configurable: false,
      enumerable: false
    });
  }
  if (this && !this.engine && options.responder_configuration && options.responder_configuration.engine){
    this.engine = options.responder_configuration.engine;
  }
  periodic_resources.core = (periodic_resources.core && typeof periodic_resources.core === 'object') ? periodic_resources.core : {};
  periodic_resources.core = Object.assign(periodic_resources.core, { controller: this });
  if (!options.skip_responder) this.initialize_responder(options);
  if (!options.skip_db) this.initialize_db(options);
  if (!options.skip_protocol) this.initialize_protocol(options);
  _INITIALIZE_UTILITY_RESPONDER.call(this);
  _INITIALIZE_ALIASED_UTILITIES.call(this);
  return this;
};

/**
 * CoreController - a class that handles implementing API strategies and providing CRUD operation convenience methods and middleware
 * @type {Core}
 */
const CORE = class Core {
  /**
   * Contructs a new Core instance
   * @param  {Object} resources Periodicjs shared resources
   * @param {Object} resources.logger A logger module that should be used in logging errors, info and warns
   * @param {Object} resources.settings Contains various application settings including theme and environment specific configurations
   * @param {Boolean} resources.settings.compatibility If strictly false compatibility mode CoreController will not be initialized and all alias methods will reference their v10 counterparts
   * @param {Object} resources.app Should contain a locals property that has local data to be shared with constructed object
   * @param  {Object} options   Configurable options for adapters and overrides
   * @param {Boolean} options.compatibility If strictly false compatibility mode CoreController will not be initialized and all alias methods will reference their v10 counterparts
   * @return {Object}           "this"
   */
  constructor(resources, options = {}) {
      periodic_resources = resources || {};
      logger = resources.logger;
      application_settings = resources.settings;
      theme = application_settings.container.name;
      appenvironment = application_settings.application.environment;
      if (periodic_resources.app && periodic_resources.app.locals) applocals = periodic_resources.app.locals;
      CoreUtilities = new Utilities(resources);
      this.responder = null;
      this.protocol = null;
      this.db = {};
      this.theme = theme;
      this.engine = resources.engine||options.engine;
      this.appenvironment = appenvironment;
      if (application_settings.compatibility !== false && options.compatibility !== false) {
        Object.defineProperty(this, 'compatibility', {
          configurable: false,
          writable: false,
          value: new COMPATIBILITY(resources, options)
        });
      }
      return _STARTUP.call(this, options, CoreUtilities);
    }
    /**
     * Initializes a responder and assigns it to the .responder property on "this". The active responder will also be used as the responder for any protocol adapters initialized after this is called
     * @param  {Object} options Configurable options for responder (see periodicjs.core.responder for more details)
     * @param {Object} options.responder_configuration Configuration for response adapter
     * @return {Object}         "this"
     */
  initialize_responder(options = {}) {
      this.responder = (options.responder_configuration) ? ResponderAdapterInterface.create(options.responder_configuration) : ResponderAdapterInterface.create({ adapter: 'json' });
      if (this.protocol) this.protocol.responder = (this.protocol.responder === null || this.protocol.responder.constructor !== this.responder.constructor) ? this.responder : this.protocol.responder
      return this;
    }
    /**
     * Initializes a protcol adapter and assigns it to the .protocol property on "this". The active protocol adapter is used for sending responses to the client and for setting up an API strategy
     * @param  {Object} options   Configurable options for protocol adapter (see periodicjs.core.protocols for more details)
     * @param {Object} options.protocol_configuration Configuration for protocol adapter
     * @param  {Object} [utilities=CoreUtilities] A set of utility methods that should be accessible by protocol adapter
     * @return {Object}           "this"
     */
  initialize_protocol(options = {}, utilities = CoreUtilities) {
      let protocolOptions = Object.assign({
        responder: this.responder,
        db: this.db,
        settings: Object.assign({}, application_settings),
        logger,
        resources: periodic_resources,
        api: 'rest',
        adapter: 'http',
        engine:this.engine,
        utilities
      }, options.protocol_configuration || {});
    protocolOptions.express = express;
    // console.log('protocolOptions engine',protocolOptions.engine);
      this.protocol = ProtocolAdapterInterface.create(protocolOptions);
      return this;
    }
    /**
     * Initializes database adapters for each given model in configuration and assigns them to the this.db object indexed by model name and assigns a default mongo adapter to the .default property on this.db
     * @param  {Object} options Configurable options for db adapters (see periodicjs.core.data for more details)
     * @param {Object} options.db_configuration Configuration for db adapters
     * @return {Object}         "this"
     */
  initialize_db(options = {}) {
    try {
      this.db = (this.db && typeof this.db === 'object') ? this.db : {};
      if (options.db_configuration) {
        if (Array.isArray(options.db_configuration)) {
          options.db_configuration.forEach(configuration => {
            this.db[configuration.model_name] = DBAdapterInterface.create(configuration);
          });
        } else this.db[options.db_configuration.model_name] = DBAdapterInterface.create(options.db_configuration);
      }
      if (!this.db.default) this.db.default = DBAdapterInterface.create({ adapter: 'mongo' });
      return this;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
};

module.exports = CORE;