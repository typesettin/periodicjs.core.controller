'use strict';
const path = require('path');
const middleware = require(path.join(__dirname, '../../utility/middleware'));
const chai = require('chai');
const expect = chai.expect;

chai.use(require('chai-spies'));

describe('middleware', function () {
	describe('save_revision', function () {
		let save_revision = middleware.save_revision;
		it('Should append saverevision flag on the req object', done => {
			let req = {};
			save_revision(req, {}, () => {
				expect(req).to.have.property('saverevision');
				expect(req.saverevision).to.be.true;
				done();
			});
		});
		it('Should call next()', done => {
			let next = chai.spy(function () {
				expect(next).to.have.been.called();
				done();
			});
			save_revision({}, {}, next);
		});
	});
});