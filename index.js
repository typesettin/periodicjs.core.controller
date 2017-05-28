/*
 * Controller
 * http://github.com/typesettin/periodic.core.controller
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */
const path = require('path');
// const COMPATIBILITY = require(path.join(__dirname, './archive/controller'));
// const deprecate = require(path.join(__dirname, './utility/deprecate'));

module.exports = require(path.join(__dirname, './lib/index'));
// module.exports.compatibility = deprecate(function (periodic, options) {
// 	return new COMPATIBILITY(periodic, options);
// }, 'CoreController compatibility mode will soon be removed');