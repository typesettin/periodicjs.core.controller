'use strict';
const Promisie = require('promisie');
const xss = require('xss');
const flatten = require('flat');

/**
 * Convenience method for .find mongo method
 * @param  {Object}   options Options for the mongo query
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param {string} [options.sort=this.sort] Sorting criteria for query will default to the this.sort value if not defined
 * @param {number} [options.limit=this.limit] Limits the total returned documents for query will default to the this.limit value if not defined
 * @param {Object|string} [options.population=this.population] The mongoose population for query will default to the this.population value if not defined
 * @param {Object} [options.fields=this.fields] The fields that should be returned in query will default to the this.fields value if not defined
 * @param {number} [options.skip] The number of documents to offset in query
 * @param  {Function} cb      Callback function for search
 */
const _SEARCH = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip } = ['sort','limit','population','fields','skip'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		Model.find((options.query && typeof options.query === 'object') ? options.query : {}, fields)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.populate(population)
			.exec(cb);
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Convenience method for returning a stream of mongo data
 * @param  {Object}   options Options for the mongo query
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param {string} [options.sort=this.sort] Sorting criteria for query will default to the this.sort value if not defined
 * @param {number} [options.limit=this.limit] Limits the total returned documents for query will default to the this.limit value if not defined
 * @param {Object|string} [options.population=this.population] The mongoose population for query will default to the this.population value if not defined
 * @param {Object} [options.fields=this.fields] The fields that should be returned in query will default to the this.fields value if not defined
 * @param {number} [options.skip] The number of documents to offset in query
 * @param  {Function} cb      Callback function for stream
 */
const _STREAM = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip } = ['sort','limit','population','fields','skip'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let stream = Model.find((options.query && typeof options.query === 'object') ? options.query : {}, fields)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.populate(population)
			.cursor();
		cb(null, stream);
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Convenience method for .find mongo method with built in pagination of data
 * @param  {Object}   options Options for the mongo query
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param {string} [options.sort=this.sort] Sorting criteria for query will default to the this.sort value if not defined
 * @param {number} [options.limit=this.limit] Limits the total returned documents for query will default to the this.limit value if not defined
 * @param {number} [options.pagelength=this.pagelength] Defines the max length of each sub-set of data
 * @param {Object|string} [options.population=this.population] The mongoose population for query will default to the this.population value if not defined
 * @param {Object} [options.fields=this.fields] The fields that should be returned in query will default to the this.fields value if not defined
 * @param {number} [options.skip] The number of documents to offset in query
 * @param  {Function} cb      Callback function for search
 */
const _SEARCH_WITH_PAGINATION = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, limit, population, fields, skip, pagelength } = ['sort','limit','population','fields','skip','pagelength'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let pages = {};
		let total = 0;
		let index = 0;
		Promisie.doWhilst(() => {
			return new Promisie((resolve, reject) => {
				_SEARCH.call(this, { sort, limit: pagelength, fields, skip, population, model: Model }, (err, data) => {
					if (err) reject(err);
					else {
						skip += data.length;
						total += data.length;
						pages[index++] = {
							documents: data,
							count: data.length
						};
						resolve(data.length);
					}
				});
			});
		}, current => (current === pagelength && total < limit))
			.then(() => cb(null, pages))
			.catch(cb);
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Convenience method for .findOne or .findById mongoose methods
 * @param  {Object}   options Configurable options for mongo query
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param {string} [options.sort=this.sort] Sorting criteria for query will default to the this.sort value if not defined
 * @param {Object|string} [options.population=this.population] The mongoose population for query will default to the this.population value if not defined
 * @param {Object} [options.fields=this.fields] The fields that should be returned in query will default to the this.fields value if not defined
 * @param {string} [options.docid="_id"] A field that should be queried will default to "_id"
 * @param {Object|string|number} options.query If value is an object query will be set to the value otherwise a query will be built based on options.docid and any other value provided in options.query
 * @param  {Function} cb      Callback function for load
 */
const _LOAD = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let { sort, population, fields, docid } = ['sort','population','fields','docid'].reduce((result, key) => {
			result[key] = options[key] || this[key];
		}, {});
		let query = (options.query && typeof options.query === 'object') ? options.query : {
			[docid || '_id']: options.query
		};
		Model.findOne(query, fields)
			.sort(sort)
			.populate(population)
			.exec(cb);
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Creates a mongoose update operation that only uses $set and $push
 * @param {Object} data Any fields that should be updated as part of patch
 * @return {Object} Returns an object with $set and $push properties
 */
const GENERATE_PATCH = function (data) {
	delete data._id;
	delete data.__v;
	let flattened = flatten(data, { safe: true });
	let $set = {};
	let $push = {};
	for (let key in flattened) {
		if (Array.isArray(flattened[key])) $push[key] = { $each: flattened[key] };
		else $set[key] = flattened[key];
	}
	return { $set, $push };
};

/**
 * Returns a cleaned object for a full document update
 * @param {Object} data A full document with updated data for put
 * @return {Object} Returns original object with reserved fields removed
 */
const GENERATE_PUT = function (data) {
	delete data._id;
	delete data.__v;
	return data;
};

/**
 * Convenience method for .update mongo method
 * @param  {Object}   options Configurable options for mongo update
 * @param {Boolean} options.isPatch If true the update will be treated as a patch instead of a full document update
 * @param {Object} options.updatedoc Either specific fields to update in the case of a patch otherwise the entire updatedated document
 * @param {string} options.id The mongo _id of the document that should be updated
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param  {Function} cb      Callback function for update
 */
const _UPDATE = function (options, cb) {
	try {
		let usePatch = options.isPatch;
		let xss_whitelist = (options.xss_whitelist) ? options.xss_whitelist : this.xss_whitelist;
		options.updatedoc = (xss_whitelist) ? JSON.parse(xss(JSON.stringify(options.updatedoc), xss_whitelist)) : options.updatedoc;
		let updateOperation = (usePatch) ? GENERATE_PATCH(options.updatedoc) : GENERATE_PUT(options.updatedoc);
		let Model = options.model || this.model;
		Model.update({ _id: options.id }, updateOperation, cb);
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Convenience method for .findAndUpdate mongoose method (returns updated document instead of normal mongo update status object)
 * @param  {Object}   options Configurable options for mongo update
 * @param {Boolean} options.isPatch If true the update will be treated as a patch instead of a full document update
 * @param {Object} options.updatedoc Either specific fields to update in the case of a patch otherwise the entire updatedated document
 * @param {string} options.id The mongo _id of the document that should be updated
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param  {Function} cb      Callback function for update
 */
const _UPDATED = function (options, cb) {
	try {
		_UPDATE.call(this, options, (err) => {
			if (err) cb(err);
			else _LOAD.call(this, { model: options.model, query: options.id }, cb);
		});
	}
	catch (e) {
		cb(e);
	}
};

/**
 * Convenience method for .create mongoose method
 * @param  {Object}   options Configurable options for mongo create
 * @param {Object} [options.model=this.model] The mongoose model for query will default to the this.model value if not defined
 * @param {Object} [options.newdoc=options] The document that should be created. If newdoc option is not passed it is assumed that the entire options object is the document
 * @param {string[]}  [options.xss_whitelist=this.xss_whitelist] XSS white-list configuration
 * @param  {Function} cb      Callback function for create
 */
const _CREATE = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let newdoc = options.newdoc || options;
		let xss_whitelist = (options.xss_whitelist) ? options.xss_whitelist : this.xss_whitelist;
		Model.create((xss_whitelist) ? JSON.parse(xss(JSON.stringify(newdoc), xss_whitelist)) : newdoc, cb);
	}
	catch (e) {
		cb(e);
	}
};

const _DELETE = function (options, cb) {
	try {
		let Model = options.model || this.model;
		let deleteid = options.deleteid || options.id;
		if (typeof deleteid !== 'string') throw new Error('Must specify "deleteid" or "id" for delete');
		Model.remove({ _id: deleteid }, cb); 
	}
	catch (e) {
		cb(e);
	}
};

const MONGO_ADAPTER = class Mongo_Adapter {
	constructor (options = {}) {
		this.docid = options.docid;
		this.model = options.model;
		this.sort = options.sort || '-createdat';
		this.limit = options.limit || 500;
		this.offset = options.offset || 0;
		this.population = options.population;
		this.fields = options.fields;
		this.pagelength = options.pagelength || 15;
		this.cache = options.cache;
		this.xss_whitelist = options.xss_whitelist || false;
		this._useCache = (options.useCache && options.cache) ? true : false;
	}
	search (options = {}, cb = false) {
		let _search = (options && options.paginate) ? _SEARCH_WITH_PAGINATION.bind(this) : _SEARCH.bind(this);
		if (typeof cb === 'function') _search(options, cb);
		else return Promisie.promisify(_search)(options);
	}
	stream (options = {}, cb = false) {
		let _stream = _STREAM.bind(this);
		if (typeof cb === 'function') _stream(options, cb);
		else return Promisie.promisify(_stream)(options);
	}
	load (options = {}, cb = false) {
		let _load = _LOAD.bind(this);
		if (typeof cb === 'function') _load(options, cb);
		else return Promisie.promisify(_load)(options);
	}
	update (options = {}, cb = false) {
		let _update = (options.return_updated) ? _UPDATED.bind(this) : _UPDATE.bind(this);
		if (typeof cb === 'function') _update(options, cb);
		else return Promisie.promisify(_update)(options);
	}
	create (options = {}, cb = false) {
		let _create = _CREATE.bind(this);
		if (typeof cb === 'function') _create(options, cb);
		else return Promisie.promisify(_create)(options);
	}
	delete (options = {}, cb = false) {
		let _delete = _DELETE.bind(this);
		if (typeof cb === 'function') _delete(options, cb);
		else return Promisie.promisify(_delete)(options);
	}
};

module.exports = MONGO_ADAPTER;
