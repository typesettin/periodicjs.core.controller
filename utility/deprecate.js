'use strict';
const util = require('util');

module.exports = function wrapWithDeprecationWarning (fn, message) {
	let isFirst = true;
	fn = fn.bind(this);
	return function () {
		if (isFirst) {
			isFirst = false;
			return util.deprecate(fn, message)(...arguments);
		}
		return fn(...arguments);
	};
};