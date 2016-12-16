'use strict';

/**
 * Express middleware that appends a saverevision flag to the req object
 * @param  {Object}   req  Express request object
 * @param  {Object}   res  Express response object
 * @param  {Function} next Express next function
 */
var save_revision = function (req, res, next) {
	req.saverevision = true;
	next();
};

module.exports = { save_revision };