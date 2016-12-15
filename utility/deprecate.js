'use strict';
const util = require('util');

module.exports = function wrapWithDeprecationWarning (fn, message, times = 1) {
	let isFirst = times;
	fn = fn.bind(this);
	return function () {
		if (isFirst) {
			isFirst--
			return util.deprecate(fn, message)(...arguments);
		}
		return fn(...arguments);
	};
};