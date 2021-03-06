'use strict';
const DIRECT = ['protocol', 'db', 'responder', 'initialize_responder', 'initialize_protocol', 'initialize_db'];
const INACCESSIBLE = ['protocol', 'db', 'responder'];
const DBOPS = ['query', 'search', 'stream', 'load', 'update', 'create', 'delete'];

/**
 * Creates a get and set trap for a Proxy. Get trap looks through child adapters to find methods nested within parent CoreController instance
 * @param  {Object} parent A parent CoreController instance
 * @return {Object}        Returns an object with "get" and "set" keys which represent get and set traps for a Proxy
 */
module.exports = function initialize_traps (parent) {
	let get = function (target, property) {
		if (DIRECT.indexOf(property) !== -1) return (typeof parent[property] === 'function') ? parent[property].bind(parent) : parent[property];
		else if (DBOPS.indexOf(property) !== -1) return parent.db.default[property].bind(parent.db.default);
		else if (property === 'initialize') return parent.protocol.api.initialize;
		//sudo-aliasing of api implementation methods following a specific pattern. Call by getting a property that beings with the keyword "initialize_" and is followed by a method name ie. edit, show, new, index, search, create, cli, update, remove, load, load_with_count, load_with_limit, paginate, routes
		else if (/^initialize_(edit|show|new|index|search|create|cli|update|remove|load|load_with_count|load_with_limit|paginate|routes)$/i.test(property)) {
			let value = property.replace(/^initialize_(.+)$/, '$1').toUpperCase();
			if (value === 'ROUTES') return parent.protocol.api.implement.bind(parent.protocol.api);
			return parent.protocol.api.initialize[value];
		}
		else {
			//sudo-aliasing of model specific CRUD methods (model adapter must already by initialized). Call by getting property that beings with method keyword ie. query, search, stream, load, update, create, delete and end with the name of the model with the first letter capitalized
			let [dbMethod, dbModel] = property.replace(/^(query|search|stream|load|update|create|delete){1}(\w+)$/, '$1,$2').toLowerCase().split(',');
			if (typeof dbModel === 'string' && dbModel.length && typeof dbMethod === 'string' && DBOPS.indexOf(dbMethod) !== -1) {
				if (parent.db[dbModel]) return parent.db[dbModel][dbMethod].bind(parent.db[dbModel]);
			}
			else {
				let sources = [];
				if (!parent.protocol) parent.logger.warn('protocol adapter has not been initialized');
				else sources.push(parent.protocol);
				if (!parent.db || (parent.db && Object.keys(parent.db).length === 0)) parent.logger.warn('db adapter has not been initialized');
				else sources.push(parent.db.default);
				if(!parent.responder) parent.logger.warn('response adapter has not been initialized');
				else sources.push(parent.responder);
				sources.push(parent);
				for (let i = 0, len = sources.length; i < len; i++) {
					if (sources[i][property]) return (typeof sources[i][property] === 'function') ? sources[i][property].bind(sources[i]) : sources[i][property];
				}
			}
			return undefined;
		}
	};
	let set = function (target, property, value) {
		if (INACCESSIBLE.indexOf(property) !== -1 || DBOPS.indexOf(property) !== -1 || DIRECT.indexOf(property) !== -1) return true;
		target[property] = value;
		return true;
	};
	return { get, set };
};
