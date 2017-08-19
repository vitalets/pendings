'use strict';

const Pendings = require(`${srcPath}/index`);

const noop = () => {};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('pendings', function () {

  let pendings;

  beforeEach(function () {
    pendings = new Pendings();
  });

  describe('exports', function () {
    it('should export Pendings', function () {
      assert.isFunction(Pendings);
    });

    it('should export Pending', function () {
      assert.isFunction(Pendings.Pending);
    });

    it('should export TimeoutError', function () {
      assert.isFunction(Pendings.TimeoutError);
    });
  });

  describe('add', function () {
    it('should return Promise', function () {
      const res = pendings.add(noop);
      assert(res instanceof Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      pendings.add(() => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = pendings.add(() => {
        throw new Error('err');
      });
      return assert.isRejected(res, 'err');
    });
  });

  describe('set', function () {
    it('should return Promise', function () {
      const res = pendings.set(1, noop);
      assert.instanceOf(res, Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      pendings.set(1, () => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = pendings.set(1, () => {
        throw new Error('err');
      });
      return assert.isRejected(res, 'err');
    });

    it('should return the same promise for second call with the same id', function () {
      const p1 = pendings.set(1, noop);
      const p2 = pendings.set(1, noop);
      assert.equal(p1, p2);
    });
  });

  describe('has', function () {
    it('should return false for non-existing promise', function () {
      assert.notOk(pendings.has(1));
    });

    it('should return true for pending promise', function () {
      pendings.set(1, noop);
      assert.ok(pendings.has(1));
    });

    describe('(autoRemove = false)', function () {
      it('should return true after resolve', function () {
        pendings.set(1, noop);
        pendings.resolve(1);
        assert.ok(pendings.has(1));
      });

      it('should return true after reject', function () {
        pendings.set(1, noop);
        pendings.reject(1);
        assert.ok(pendings.has(1));
      });
    });

    describe('(autoRemove = true)', function () {
      beforeEach(function () {
        pendings = new Pendings({autoRemove: true});
      });

      it('should return false after resolve', function () {
        pendings.set(1, noop);
        pendings.resolve(1);
        assert.notOk(pendings.has(1));
      });

      it('should return false after reject', function () {
        pendings.set(1, noop);
        pendings.reject(1);
        assert.notOk(pendings.has(1));
      });
    });
  });

  describe('resolve', function () {
    it('should resolve', function () {
      const res = pendings.set(1, noop);
      pendings.resolve(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.throws(() => pendings.resolve(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryResolve', function () {
    it('should resolve', function () {
      const res = pendings.set(1, noop);
      pendings.tryResolve(1, 'foo');
      pendings.tryResolve(1, 'bar');
      return assert.eventually.equal(res, 'foo');
    });

    it('should not throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.doesNotThrow(() => pendings.tryResolve(2, 'foo'));
    });
  });

  describe('reject', function () {
    it('should reject manually', function () {
      const res = pendings.set(1, noop);
      pendings.reject(1, new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should reject by fn', function () {
      const res = pendings.set(1, () => { throw new Error('err'); });
      return assert.isRejected(res, 'err');
    });

    it('should reject by timeout', function () {
      const res = pendings.set(1, noop, {timeout: 5});
      res.catch(() => {});
      return wait(10).then(() => assert.isRejected(res, 'Promise rejected by timeout (5 ms)'));
    });

    it('should throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.throws(() => pendings.reject(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryReject', function () {
    it('should not throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.doesNotThrow(() => pendings.tryReject(2, 'foo'));
    });

    it('should reject', function () {
      const res = pendings.set(1, noop);
      pendings.tryReject(1, new Error('err'));
      pendings.tryReject(1, new Error('err2'));
      return assert.isRejected(res, 'err');
    });
  });

  describe('fulfill', function () {
    it('should resolve', function () {
      const res = pendings.set(1, noop);
      pendings.fulfill(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject', function () {
      const res = pendings.set(1, noop);
      pendings.fulfill(1, 'foo', new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.throws(() => pendings.fulfill(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryFulfill', function () {
    it('should not throw for incorrect id', function () {
      pendings.set(1, noop);
      assert.doesNotThrow(() => pendings.tryFulfill(2, 'foo'));
    });

    it('should resolve', function () {
      const res = pendings.set(1, noop);
      pendings.tryFulfill(1, 'foo');
      pendings.tryFulfill(1, 'bar');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject', function () {
      const res = pendings.set(1, noop);
      pendings.tryFulfill(1, 'foo', new Error('err'));
      pendings.tryFulfill(1, 'foo', new Error('err2'));
      return assert.isRejected(res, 'err');
    });
  });

  describe('rejectAll', function () {
    it('should reject all promises', function () {
      const p1 = pendings.add(noop);
      const p2 = pendings.set(1, noop);
      pendings.rejectAll('err');
      return Promise.all([
        assert.isRejected(p1, 'err'),
        assert.isRejected(p2, 'err'),
      ]);
    });
  });

  describe('clear', function () {
    it('should remove all promises from list', function () {
      pendings.add(noop);
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      pendings.resolve(1, 'foo');
      pendings.reject(2, 'err');
      assert.equal(pendings.count, 3);
      pendings.clear();
      assert.equal(pendings.count, 0);
    });

    it('should resolve waitAll with empty result', function () {
      pendings.add(noop);
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      const res = pendings.waitAll();
      pendings.clear();
      return assert.eventually.deepEqual(res, {resolved: {}, rejected: {}});
    });
  });

  describe('waitAll', function () {
    it('should resolve with empty for empty list', function () {
      const res = pendings.waitAll();
      return assert.eventually.deepEqual(res, {resolved: {}, rejected: {}});
    });

    it('should resolve with resolved/rejected values', function () {
      pendings.set(1, noop);
      pendings.set(2, noop);
      pendings.set(3, () => Promise.resolve('bar'));
      pendings.set(4, noop).catch(() => {});
      const res = pendings.waitAll();
      pendings.resolve(1, 'foo');
      pendings.reject(4, 'err');
      setTimeout(() => pendings.resolve(2, 'foo2'), 10);
      return assert.eventually.deepEqual(res, {
        resolved: {
          '1': 'foo',
          '2': 'foo2',
          '3': 'bar'
        },
        rejected: {
          '4': 'err'
        }
      });
    });

    it('should accumulate resolved values for several calls', function () {
      pendings.set(1, noop);
      pendings.resolve(1, 'foo');
      const p1 = pendings.waitAll();
      pendings.set(2, noop);
      pendings.resolve(2, 'bar');
      const p2 = pendings.waitAll();
      return Promise.all([
        assert.eventually.deepEqual(p1, {
          resolved: {'1': 'foo'},
          rejected: {},
        }),
        assert.eventually.deepEqual(p2, {
          resolved: {'1': 'foo', '2': 'bar'},
          rejected: {},
        }),
      ]);
    });

    it('should resolve with empty result for autoRemove: true', function () {
      const pendings = new Pendings({autoRemove: true});
      pendings.set(1, noop);
      pendings.set(2, noop);
      pendings.set(3, noop).catch(() => {});
      const res = pendings.waitAll();
      pendings.resolve(1, 'foo');
      setTimeout(() => pendings.resolve(2, 'foo2'), 10);
      pendings.reject(3);
      return assert.eventually.deepEqual(res, {resolved: {}, rejected: {}});
    });
  });

  describe('count', function () {
    it('should increase and decrease count of promises (autoRemove: true)', function () {
      pendings = new Pendings({autoRemove: true});
      assert.equal(pendings.count, 0);
      pendings.set(1, noop);
      assert.equal(pendings.count, 1);
      pendings.set(2, noop).catch(() => {});
      assert.equal(pendings.count, 2);
      pendings.resolve(1);
      assert.equal(pendings.count, 1);
      pendings.reject(2);
      assert.equal(pendings.count, 0);
    });

    it('should increase count of promises (autoRemove: false)', function () {
      pendings = new Pendings({autoRemove: false});
      assert.equal(pendings.count, 0);
      pendings.set(1, noop);
      assert.equal(pendings.count, 1);
      pendings.set(2, noop).catch(() => {});
      assert.equal(pendings.count, 2);
      pendings.resolve(1);
      assert.equal(pendings.count, 2);
      pendings.reject(2);
      assert.equal(pendings.count, 2);
    });
  });

  describe('generateId', function () {
    it('should change generated ids', function () {
      pendings.generateId = () => 1;
      pendings.add(id => assert.equal(id, 1));
    });
  });

  describe('options: timeout', function () {
    it('should resolve before timeout', function () {
      const res = pendings.set(1, noop, {timeout: 10});
      setTimeout(() => pendings.resolve(1, 'foo'), 5);
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject after timeout', function () {
      const res = pendings.set(1, noop, {timeout: 5});
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });

    it('should reject after default timeout', function () {
      pendings = new Pendings({timeout: 5});
      const res = pendings.set(1, noop);
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });

    it('should overwrite default timeout', function () {
      pendings = new Pendings({timeout: 10});
      const res = pendings.set(1, noop, {timeout: 5});
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });
  });

  describe('options: idPrefix', function () {
    it('should set idPrefix', function () {
      let id;
      pendings = new Pendings({idPrefix: 'client1'});
      pendings.add(_id => id = _id);
      assert.equal(id.indexOf('client1'), 0);
    });
  });

  describe('options: autoRemove', function () {
    it('should store fulfilled pendings for autoRemove = false (default)', function () {
      pendings = new Pendings({autoRemove: false});
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      pendings.set(3, noop);
      pendings.resolve(1);
      pendings.reject(2);
      assert.equal(pendings.count, 3);
    });

    it('should not store fulfilled pendings for autoRemove = true', function () {
      pendings = new Pendings({autoRemove: true});
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      pendings.set(3, noop);
      pendings.resolve(1);
      pendings.reject(2);
      assert.equal(pendings.count, 1);
    });
  });
});
