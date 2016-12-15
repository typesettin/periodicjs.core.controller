'use strict';

var save_revision = function (req, res, next) {
	req.saverevision = true;
	next();
};

module.exports = { save_revision };