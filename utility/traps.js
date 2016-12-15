'use strict';
const DIRECT = ['protocol', 'db', 'responder', 'initialize_responder', 'initialize_protocol', 'initialize_db'];
const INACCESSIBLE = ['protocol', 'db', 'responder'];
const DBOPS = ['query', 'search', 'stream', 'load', 'update', 'create', 'delete'];

module.exports = function initialize_traps (parent) {
	let get = function (target, property) {
		if (DIRECT.indexOf(property) !== -1) return (typeof parent[property] === 'function') ? parent[property].bind(parent) : parent[property];
		else if (DBOPS.indexOf(property) !== -1) return parent.db.default[property].bind(parent.db.default);
		else {
			let [dbMethod, dbModel] = property.replace(/^(query|search|stream|load|update|create|delete){1}(\w+)$/, '$1,$2').toLowerCase().split(',');
			if (typeof dbModel === 'string' && dbModel.length && typeof dbMethod === 'string' && DBOPS.indexOf(dbMethod) !== -1) {
				if (parent.db[dbModel]) return parent.db[dbModel][dbMethod].bind(parent.db[dbModel]);
			}
			else {
				let sources = [];
				if (!parent.protocol) logger.warn('protocol adapter has not been initialized');
				else sources.push(parent.protocol);
				if (!parent.db) logger.warn('db adapter has not been initialized');
				if(!parent.responder) logger.warn('response adapter has not been initialized');
				else sources.push(parent.responder);
				sources.push(parent);
				for (let i = 0, len = sources.length; i < len; i++) {
					if (sources[i][property]) return (typeof sources[i][property] === 'function') ? sources[i][property].bind(sources[i]) : sources[i][property];
				}
				if (parent.db && parent.db === 'object') {
					if (parent.db.default[property]) return (typeof parent.db.default[property] === 'function') ? parent.db.default[property].bind(parent.db.default) : parent.db.default[property];
				}
			}
			return undefined;
		}
	};
	let set = function (target, property, value) {
		if (INACCESSIBLE.indexOf(property) !== -1 || DBOPS.indexOf(property) !== -1) return false;
		parent[property] = value;
		return true;
	};
	return { get, set };
};
