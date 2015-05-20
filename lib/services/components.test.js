'use strict';

var _ = require('lodash'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  responses = require('../responses'),
  sinon = require('sinon'),
  files = require('../files'),
  db = require('./db'),
  glob = require('glob'),
  config = require('config'),
  bluebird = require('bluebird'),
  expect = require('chai').expect,
  log = require('../log');

describe(_.startCase(filename), function () {
  var sandbox;

  /**
   * Shortcut
   */
  function expectNoLogging() {
    var logExpectations = sandbox.mock(log);
    logExpectations.expects('info').never();
    logExpectations.expects('warn').never();
    logExpectations.expects('error').never();
  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    expectNoLogging();
  });

  afterEach(function () {
    sandbox.verifyAndRestore();
  });

  describe('getName', function () {
    var fn = lib[this.title];

    it('finds /components/name', function () {
      expect(fn('/components/name')).to.equal('name');
    });

    it('finds /components/name/', function () {
      expect(fn('/components/name/')).to.equal('name');
    });

    it('finds /components/name/instances/id', function () {
      expect(fn('/components/name/instances/id')).to.equal('name');
    });

    it('finds /components/name.ext', function () {
      expect(fn('/components/name.ext')).to.equal('name');
    });

    it('finds /components/name@version', function () {
      expect(fn('/components/name@version')).to.equal('name');
    });
  });

  describe('getTemplate', function () {
    var fn = lib[this.title];

    it('throws error if no templates found', function () {
      sandbox.stub(glob, 'sync').returns([]);
      expect(function () {
        return fn('');
      }).to.throw(Error);
    });

    it('returns template', function () {
      var reference = '/components/whatever',
        template = 'template.nunjucks';
      sandbox.stub(files, 'getComponentPath').returns('asdf');
      sandbox.stub(glob, 'sync').returns([template]);
      sandbox.stub(config, 'get').returns('asdf');

      expect(fn(reference)).to.eql(template);
    });
  });

  describe('resolveDataReferences', function () {
    var fn = lib[this.title];

    it('looks up references', function (done) {
      var mock,
        data = {
          a: {_ref:'/components/b'},
          c: {d: {_ref:'/components/e'}}
        };

      sandbox.stub(files, 'getComponentModule', _.noop);

      mock = sandbox.mock(db);
      mock.expects('get').withArgs('/components/b').once().returns(bluebird.resolve(JSON.stringify({g: 'h'})));
      mock.expects('get').withArgs('/components/e').once().returns(bluebird.resolve(JSON.stringify({i: 'j'})));

      fn(data).done(function (result) {
        sandbox.verify();
        expect(result).to.deep.equal({
          a: { _ref: '/components/b', g: 'h' },
          c: { d: { _ref: '/components/e', i: 'j' } }
        });
        done();
      });
    });

    it('looks up references recursively', function (done) {
      var mock,
        data = {
          a: {_ref:'/components/b'},
          c: {d: {_ref:'/components/e'}}
        };

      sandbox.stub(files, 'getComponentModule', _.noop);

      mock = sandbox.mock(db);
      mock.expects('get').withArgs('/components/b').once().returns(bluebird.resolve(JSON.stringify({g: 'h'})));
      mock.expects('get').withArgs('/components/e').once().returns(bluebird.resolve(JSON.stringify({i: 'j', k: {_ref:'/components/m'}})));
      mock.expects('get').withArgs('/components/m').once().returns(bluebird.resolve(JSON.stringify({n: 'o'})));

      fn(data).done(function (result) {
        sandbox.verify();
        expect(result).to.deep.equal({
          a: { _ref: '/components/b', g: 'h' },
          c: { d: {
            _ref: '/components/e',
            i: 'j',
            k: {
              _ref: '/components/m',
              n: 'o' //we just recursively looked this up from another lookup
            }
          } }
        });
        done();
      });
    });
  });

  describe('putDefaultBehavior', function () {
    var fn = lib[this.title];

    it('throws error on @list', function () {
      expect(function () {
        fn('/components/whatever@list', {});
      }).to.throw();
    });
  });

  describe('putTag', function () {
    var fn = lib[this.title];

    it('puts to tag', function (done) {
      sandbox.mock(db).expects('batch').withArgs().once().returns(bluebird.resolve());
      fn('/components/whatever', {}, 'special').done(function () {
        done();
      }, function (err) {
        done(err);
      });
    });
  });

  describe('putPublished', function () {
    var fn = lib[this.title];

    it('puts to published', function (done) {
      sandbox.mock(db).expects('batch').withArgs().once().returns(bluebird.resolve());
      fn('/components/whatever', {}).done(function () {
        done();
      }, function (err) {
        done(err);
      });
    });
  });

  describe('putLatest', function () {
    var fn = lib[this.title];

    it('puts to latest', function (done) {
      sandbox.mock(db).expects('batch').withArgs().once().returns(bluebird.resolve());
      fn('/components/whatever', {}).done(function () {
        done();
      }, function (err) {
        done(err);
      });
    });
  });

  describe('del', function () {
    var fn = lib[this.title];

    it('throws error if component module does not return promise', function () {

    });

    it('deletes', function (done) {
      var mockDb = sandbox.mock(db),
        mockFiles = sandbox.mock(files);
      mockDb.expects('get').withArgs().once().returns(bluebird.resolve('{}'));
      mockDb.expects('del').withArgs().once().returns(bluebird.resolve());
      mockFiles.expects('getComponentModule').withArgs('whatever').twice().returns(null);
      fn('/components/whatever').done(function () {
        done();
      }, function (err) {
        done(err);
      });
    });
  });

  describe('put', function () {
    var fn = lib[this.title];

    it('throws error if component module does not return promise', function () {

    });
  });

  describe('get', function () {
    var fn = lib[this.title];

    it('throws error if component module does not return promise', function () {

    });
  });
});