'use strict';
const util = require('util');

/**
 * Wraps a function such that it will display a deprecation warning when it is called
 * @param  {Function} fn      Function that is deprecated
 * @param  {string}   message Deprecation warning that should be displayed
 * @param  {Number}   [times=1]   Number of times to display the deprecation warning. If value is less than 1 defaults to 1
 * @return {Function}           A deprecated method function
 */
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