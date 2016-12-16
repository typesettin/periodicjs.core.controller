'use strict';
const util = require('util');

module.exports = function wrapWithDeprecationWarning (fn, message, times = 1) {
	let showWarning = (typeof times === 'number' && times > 0) ? times : 1;
	fn = fn.bind(this);
	return function deprecated_method () {
		if (showWarning) {
			showWarning--
			return util.deprecate(fn, message)(...arguments);
		}
		return fn(...arguments);
	};
};