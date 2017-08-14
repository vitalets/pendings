'use strict';

const Pendings = require(`${srcPath}/index`);

const noop = () => {};

describe('pendings', function () {
  beforeEach(function () {
    this.pendings = new Pendings();
  });

  describe('add', function () {
    it('should return Promise', function () {
      const res = this.pendings.add(noop);
      assert(res instanceof Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pendings.add(() => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = this.pendings.add(() => {
        throw new Error('err');
      });
      return assert.isRejected(res, 'err');
    });
  });

  describe('set', function () {
    it('should return Promise', function () {
      const res = this.pendings.set(1, noop);
      assert.instanceOf(res, Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pendings.set(1, () => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = this.pendings.set(1, () => {
        throw new Error('err');
      });
      return assert.isRejected(res, 'err');
    });

    it('should return the same promise for second call with the same id', function () {
      const p1 = this.pendings.set(1, noop);
      const p2 = this.pendings.set(1, noop);
      assert.equal(p1, p2);
    });
  });

  describe('has', function () {
    it('should return false for non-existing promise', function () {
      assert.notOk(this.pendings.has(1));
    });

    it('should return true for pending promise', function () {
      this.pendings.set(1, noop);
      assert.ok(this.pendings.has(1));
    });

    it('should return false for resolve', function () {
      this.pendings.set(1, noop);
      this.pendings.resolve(1);
      assert.notOk(this.pendings.has(1));
    });

    it('should return false for manual reject', function () {
      this.pendings.set(1, noop);
      this.pendings.reject(1);
      assert.notOk(this.pendings.has(1));
    });

    it('should return false for reject by fn', function () {
      this.pendings.set(1, () => { throw new Error('foo'); });
      assert.notOk(this.pendings.has(1));
    });

    it('should return false for reject by timeout', function (done) {
      this.pendings.set(1, noop, {timeout: 5});
      assert.ok(this.pendings.has(1));
      setTimeout(() => {
        assert.notOk(this.pendings.has(1));
        done();
      }, 10);
    });
  });

  describe('resolve', function () {
    it('should resolve', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.resolve(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.throws(() => this.pendings.resolve(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryResolve', function () {
    it('should resolve', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.tryResolve(1, 'foo');
      this.pendings.tryResolve(1, 'bar');
      return assert.eventually.equal(res, 'foo');
    });

    it('should not throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.doesNotThrow(() => this.pendings.tryResolve(2, 'foo'));
    });
  });

  describe('reject', function () {
    it('should reject', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.reject(1, new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.throws(() => this.pendings.reject(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryReject', function () {
    it('should not throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.doesNotThrow(() => this.pendings.tryReject(2, 'foo'));
    });

    it('should reject', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.tryReject(1, new Error('err'));
      this.pendings.tryReject(1, new Error('err2'));
      return assert.isRejected(res, 'err');
    });
  });

  describe('fulfill', function () {
    it('should resolve', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.fulfill(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.fulfill(1, 'foo', new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.throws(() => this.pendings.fulfill(2, 'foo'), 'Pending promise not found with id: 2');
    });
  });

  describe('tryFulfill', function () {
    it('should not throw for incorrect id', function () {
      this.pendings.set(1, noop);
      assert.doesNotThrow(() => this.pendings.tryFulfill(2, 'foo'));
    });

    it('should resolve', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.tryFulfill(1, 'foo');
      this.pendings.tryFulfill(1, 'bar');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject', function () {
      const res = this.pendings.set(1, noop);
      this.pendings.tryFulfill(1, 'foo', new Error('err'));
      this.pendings.tryFulfill(1, 'foo', new Error('err2'));
      return assert.isRejected(res, 'err');
    });
  });

  describe('rejectAll', function () {
    it('should reject all promises', function () {
      const p1 = this.pendings.add(noop);
      const p2 = this.pendings.set(1, noop);
      this.pendings.rejectAll('err');
      return Promise.all([
        assert.isRejected(p1, 'err'),
        assert.isRejected(p2, 'err'),
      ]);
    });
  });

  describe.skip('waitAllFulfilled', function () {
    it('should return resolved and rejected promises', function () {
      // const p1 = this.pendings.add(noop);
      // const p2 = this.pendings.set(1, noop);
      // this.pendings.rejectAll('err');
      // const res = this.pendings.waitAllFulfilled();
      // return assert.eventually.equal(res, 'foo');
    });
  });

  describe('generateId', function () {
    it('should change generated ids', function () {
      this.pendings.generateId = () => 1;
      this.pendings.add(id => assert.equal(id, 1));
    });
  });

  describe('options: timeout', function () {
    it('should resolve before timeout', function () {
      const res = this.pendings.set(1, noop, {timeout: 10});
      setTimeout(() => this.pendings.resolve(1, 'foo'), 5);
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject after timeout', function () {
      const res = this.pendings.set(1, noop, {timeout: 5});
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });

    it('should reject after default timeout', function () {
      const pendings = new Pendings({timeout: 5});
      const res = pendings.set(1, noop);
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });

    it('should overwrite default timeout', function () {
      const pendings = new Pendings({timeout: 10});
      const res = pendings.set(1, noop, {timeout: 5});
      return assert.isRejected(res, 'Promise rejected by timeout (5 ms)');
    });
  });

  describe('options: idPrefix', function () {
    it('should set idPrefix', function () {
      let id;
      const pendings = new Pendings({idPrefix: 'client1'});
      pendings.add(_id => id = _id);
      assert.equal(id.indexOf('client1'), 0);
    });
  });

  describe('options: persistent', function () {
    it('should not store fulfilled pendings for persistent = false', function () {
      const pendings = new Pendings({persistent: false});
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      pendings.set(3, noop);
      pendings.resolve(1);
      pendings.reject(2);
      assert.equal(Object.keys(pendings._map).length, 1);
    });

    it('should store fulfilled pendings for persistent = true', function () {
      const pendings = new Pendings({persistent: true});
      pendings.set(1, noop);
      pendings.set(2, noop).catch(() => {});
      pendings.set(3, noop);
      pendings.resolve(1);
      pendings.reject(2);
      assert.equal(Object.keys(pendings._map).length, 3);
    });
  });

  describe('exports', function () {
    it('should export Pending', function () {
      assert.ok(Pendings.Pending);
    });

    it('should export TimeoutError', function () {
      assert.ok(Pendings.TimeoutError);
    });
  });

});
