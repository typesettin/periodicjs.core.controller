'use strict';
const path = require('path');

const ADPATERS = {
	mongo: require(path.join(__dirname, './mongo'))
};

const DB_ADAPTER_INTERFACE = class DB_ADAPTER_INTERFACE {
	constructor (options = {}) {
		for (let key in options) {
			this[key] = options[key];
		}
	}
	create (options = {}) {
		let Adapter = (typeof options.adapter === 'string') ? ADPATERS[options.adapter] : options.adapter;
		if (!Adapter) throw new Error('Could not find a corresponding adapter - for custom adapters pass the constructor as the "adapater" options');
		let adapater = new Adapter(options);
		let errors = [];
		for (let key in adapater) {
			if (typeof adapater[key] !== this[key]) errors.push(`${ key } is invalid type ${ typeof adapater[key] } and should be ${ this[key] }`);
		}
		if (errors.length) {
			let compiledErrors = errors.reduce((result, error, index) => {
				if (index === errors.length - 1) result += error;
				else result += `${ error }, `;
			}, '');
			throw new Error(compiledErrors);
		}
		return adapter;
	}
};

module.exports = new DB_ADAPTER_INTERFACE({
	load: 'function',
	search: 'function',
	update: 'function',
	delete: 'function',
	create: 'function'
});