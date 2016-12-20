'use strict';
const path = require('path');
const CoreController = require(path.join(__dirname, '../../index'));
const chai = require('chai');
const expect = chai.expect;
const ExampleSchema = require(path.join(__dirname, '../examples/example'));
const mongoose = require('mongoose');
const Promisie = require('promisie');
const moment = require('moment');

chai.use(require('chai-spies'));

var Example;
var exampleDocuments = [];
var connectDB = function () {
	return new Promisie((resolve, reject) => {
		if (mongoose.connection.readyState) resolve();
		else {
			mongoose.connect('mongodb://localhost/test_core_controller');
			let db = mongoose.connection;
			db.on('error', reject)
				.once('open', resolve);
		}
	});
};

describe('Aliased Data Methods', function () {
	let controller;
	before(done => {
		connectDB()
			.then(() => {
				Example = mongoose.model('Example', ExampleSchema);
				controller = new CoreController({
					settings: {
						theme: 'periodicjs.theme.default',
						application: {
							environment: 'test'
						}
					},
					logger: console
				}, {
					db_configuration: [{
						model_name: 'example',
						adapter: 'mongo',
						model: 'Example'
					}]
				});
				done();
			}, done);
	});
	after(done => {
		if (Example) {
			let ChangeSet = mongoose.model('Changeset');
			Promisie.promisify(ChangeSet.remove, ChangeSet)({})
				.then(() => Promisie.promisify(Example.remove, Example)({}))
				.then(() => done())
				.catch(done);
		}
		else done();
	});
	describe('createModel', function () {
		let originalCreate;
		before(() => {
			originalCreate = controller.db.default.create.bind(controller.db.default);
			controller.db.default.create = chai.spy(originalCreate);
		});
		after(() => {
			controller.db.default.create = originalCreate;
		});
		it('Should be a function', () => {
			expect(controller.createModel).to.be.a('function');
		});
		it('Should be able to create an document in the example collection', done => {
			let person = {
				contact: {
					first_name: 'Distinct',
					last_name: 'Name',
					dob: moment('09/18/1990', 'MM/DD/YYYY').format()
				}
			};
			controller.createModel({ newdoc: person, model: Example })
				.try(result => {
					expect(result.contact.first_name).to.equal('Distinct');
					expect(result).to.have.property('_id');
					expect(controller.db.default.create).to.have.been.called.once;
					exampleDocuments.push(result.toObject());
					done();
				})
				.catch(done);
		});
		it('Should be accessible through the "meta" property', done => {
			let person = {
				contact: {
					first_name: 'Distinctly',
					last_name: 'Name',
					dob: moment('09/18/1990', 'MM/DD/YYYY').format()
				}
			};
			controller.meta.create({ newdoc: person, model: Example })
				.try(result => {
					expect(result.contact.first_name).to.equal('Distinctly');
					expect(result).to.have.property('_id');
					expect(controller.db.default.create).to.have.been.called.twice;
					exampleDocuments.push(result.toObject());
					done();
				})
				.catch(done);
		});
	});
	describe('updateModel', function () {
		let originalUpdate;
		before(() => {
			originalUpdate = controller.db.default.update.bind(controller.db.default);
			controller.db.default.update = chai.spy(originalUpdate);
		});
		after(() => {
			controller.db.default.update = originalUpdate;
		});
		it('Should be a function', () => {
			expect(controller.updateModel).to.be.a('function');
		});
		it('Should be able to update a document in the example collection', done => {
			let person = Object.assign({}, exampleDocuments[0]);
			person.contact = Object.assign({}, person.contact, { first_name: 'SomeOtherName' });
			controller.updateModel({ updatedoc: person, originalrevision: exampleDocuments[0], id: person._id, model: Example })
				.then(() => Promisie.promisify(Example.findById, Example)(person._id))
				.try(result => {
					result = result.toObject();
					exampleDocuments[0] = result;
					expect(result.contact.first_name).to.equal('SomeOtherName');
					expect(controller.db.default.update).to.have.been.called.once;
					done();
				})
				.catch(done);
		});
		it('Should be able to perform a patch update and return updated in the example collection', done => {
			let person = Object.assign({}, exampleDocuments[0]);
			let updatedoc = {
				contact: {
					last_name: 'SomeOtherLastName'
				}
			};
			controller.updateModel({
				updatedoc,
				originalrevision: person,
				id: person._id,
				isPatch: true,
				model: Example
			})	
				.then(() => Promisie.promisify(Example.findById, Example)(person._id))
				.try(result => {
					result = result.toObject();
					exampleDocuments[0] = result;
					expect(result.contact.first_name).to.equal('SomeOtherName');
					expect(result.contact.first_name).to.equal('SomeOtherName');
					expect(controller.db.default.update).to.have.been.called.twice;
					done();
				})
				.catch(done);
		});
		it('Should be accessible through the "meta" property', done => {
			let person = Object.assign({}, exampleDocuments[0]);
			person.contact = Object.assign({}, person.contact, { dob: moment('12/20/1990', 'MM/DD/YYYY').format() });
			controller.meta.update({
				updatedoc: person,
				originalrevision: exampleDocuments[0],
				id: person._id,
				model: Example
			})
				.then(() => Promisie.promisify(Example.findById, Example)(person._id))
				.try(result => {
					result = result.toObject();
					exampleDocuments[0] = result;
					expect(moment(result.contact.dob).format('MM/DD/YYYY')).to.equal('12/20/1990');
					expect(controller.db.default.update).to.have.been.called.exactly(3);
					done();
				})
				.catch(done);
		});
	});
	describe('loadModel', function () {
		let originalLoad;
		before(() => {
			originalLoad = controller.db.default.load.bind(controller.db.default);
			controller.db.default.load = chai.spy(originalLoad);
		});
		after(() => {
			controller.db.default.load = originalLoad;
		});
		it('Should be a function', () => {
			expect(controller.loadModel).to.be.a('function');
		});
		it('Should be able to load a document from example collection', done => {
			controller.loadModel({ model: Example, query: exampleDocuments[0]._id })
				.try(result => {
					expect(result.toObject()).to.deep.equal(exampleDocuments[0]);
					expect(controller.db.default.load).to.have.been.called.once;
					done();
				})
				.catch(done);
		});
		it('Should be able to load a document by docid', done => {
			controller.loadModel({ model: Example, query: exampleDocuments[0].contact.first_name, docid: 'contact.first_name' })
				.try(result => {
					expect(result.toObject()).to.deep.equal(exampleDocuments[0]);
					expect(controller.db.default.load).to.have.been.called.twice;
					done();
				})
				.catch(done);
		});
		it('Should be accessible through the "meta" property', done => {
			controller.meta.load({ model: Example, query: exampleDocuments[0]._id })
				.try(result => {
					expect(result.toObject()).to.deep.equal(exampleDocuments[0]);
					expect(controller.db.default.load).to.have.been.called.exactly(3);
					done();
				})
				.catch(done);
		});
	});
	describe('searchModel', function () {
		let searchModel;
		before(() => {
			searchModel = controller.db.default.search.bind(controller.db.default);
			controller.db.default.search = chai.spy(searchModel);
		});
		after(() => {
			controller.db.default.search = searchModel;
		});
		it('Should be a function', () => {
			expect(controller.searchModel).to.be.a('function');
		});
		it('Should be able to handle simple a query object', done => {
			let query = {
				'contact.first_name': /distinct\w+/i
			};
			controller.searchModel({ model: Example, query })
				.try(result => {
					expect(result.length).to.equal(1);
					expect(result[0].toObject()).to.deep.equal(exampleDocuments[1]);
					expect(controller.db.default.search).to.have.been.called.once;
					done();
				})
				.catch(done);
		});
		it('Should be able to handle delimited string queries', done => {
			let query = 'Ricky,Bobby,Distinctly';
			let search = 'contact.first_name';
			controller.searchModel({ model: Example, query, search, delimeter: ',' })
				.try(result => {
					expect(result.length).to.equal(1);
					expect(result[0].toObject()).to.deep.equal(exampleDocuments[1]);
					expect(controller.db.default.search).to.have.been.called.twice;
					done();
				})
				.catch(done);
		});
		it('Should be able to handle docid queries and be accessible through the "meta" property', done => {
			let values = 'Ricky,Bobby,Distinctly';
			let docid = 'contact.first_name';
			controller.meta.search({ model: Example, values, docid })
				.try(result => {
					expect(result.length).to.equal(1);
					expect(result[0].toObject()).to.deep.equal(exampleDocuments[1]);
					expect(controller.db.default.search).to.have.been.called.exactly(3);
					done();
				})
				.catch(done);
		});
	});
	describe('deleteModel', function () {
		let originalDelete;
		before(() => {
			originalDelete = controller.db.default.delete.bind(controller.db.default);
			controller.db.default.delete = chai.spy(originalDelete);
		});
		after(() => {
			controller.db.default.delete = originalDelete;
		});
		it('Should be a function', () => {
			expect(controller.deleteModel).to.be.a('function');
		});
		it('Should be able to delete a document from a collection', done => {
			controller.deleteModel({ model: Example, deleteid: exampleDocuments[0]._id.toString() })
				.then(() => Promisie.promisify(Example.findById, Example)(exampleDocuments[0]._id.toString()))
				.try(result => {
					expect(result).to.equal(null);
					expect(controller.db.default.delete).to.have.been.called.once;
					done();
				})
				.catch(done);
		});
		it('Should be accessible through the "meta" property', done => {
			controller.meta.delete({ model: Example, deleteid: exampleDocuments[1]._id.toString() })
				.then(() => Promisie.promisify(Example.findById, Example)(exampleDocuments[1]._id.toString()))
				.try(result => {
					expect(result).to.equal(null);
					expect(controller.db.default.delete).to.have.been.called.twice;
					done();
				})
				.catch(done);
		});
	});
});
