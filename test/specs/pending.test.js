'use strict';

const Pending = require(`${srcPath}/pending`);

const noop = () => {};

describe('pending', function () {
  beforeEach(function () {
    this.pending = new Pending();
  });

  describe('call', function () {
    it('should return Promise', function () {
      const res = this.pending.call(noop);
      assert.instanceOf(res, Promise);
    });

    it('should store Promise', function () {
      const res = this.pending.call(noop);
      assert.instanceOf(this.pending.promise, Promise);
      assert.equal(res, this.pending.promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pending.call(() => a++);
      assert.equal(a, 1);
    });

    it('should return the same promise for second call if previous was not fulfilled', function () {
      const p1 = this.pending.call(noop);
      const p2 = this.pending.call(noop);
      assert.equal(p1, p2);
    });

    it('should return the same promise for second call if previous was fulfilled', function () {
      const p1 = this.pending.call(noop);
      this.pending.resolve();
      const p2 = this.pending.call(noop);
      assert.equal(p1, p2);
    });

    it('should return new promise for second call after resolve + reset', function () {
      const p1 = this.pending.call(noop);
      this.pending.resolve();
      this.pending.reset();
      const p2 = this.pending.call(noop);
      assert.notEqual(p1, p2);
    });

    it('should return new promise for second call after reject + reset', function () {
      const p1 = this.pending.call(noop);
      this.pending.reject();
      this.pending.reset();
      const p2 = this.pending.call(noop);
      assert.notEqual(p1, p2);
    });

    it('should allow to call without fn', function () {
      const res = this.pending.call();
      this.pending.resolve('foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should proxy resolve if fn returns promise', function () {
      const res = this.pending.call(() => Promise.resolve('foo'));
      return assert.eventually.equal(res, 'foo');
    });

    it('should proxy reject if fn returns promise', function () {
      const res = this.pending.call(() => Promise.reject(new Error('err')));
      return assert.isRejected(res, 'err');
    });
  });

  describe('resolve', function () {
    it('should resolve directly', function () {
      const res = this.pending.call(noop);
      this.pending.resolve('foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should resolve inside fn', function () {
      const res = this.pending.call(() => this.pending.resolve('foo'));
      return assert.eventually.equal(res, 'foo');
    });

    it('should keep first value if resolved twice', function () {
      const res = this.pending.call(noop);
      this.pending.resolve('foo');
      this.pending.resolve('bar');
      return assert.eventually.equal(res, 'foo');
    });

    it('should do nothing for resolve without call', function () {
      assert.doesNotThrow(() => this.pending.resolve('foo'));
    });
  });

  describe('reject', function () {
    it('should reject in case of error in fn', function () {
      const res = this.pending.call(() => {
        throw new Error('err');
      });
      return assert.isRejected(res, 'err');
    });

    it('should reject directly', function () {
      const res = this.pending.call(noop);
      this.pending.reject(new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should reject inside fn', function () {
      const res = this.pending.call(() => this.pending.reject(new Error('err')));
      return assert.isRejected(res, 'err');
    });

    it('should keep first value if rejected twice', function () {
      const res = this.pending.call(noop);
      this.pending.reject(new Error('foo'));
      this.pending.reject(new Error('bar'));
      return assert.isRejected(res, 'foo');
    });

    it('should do nothing for reject without call', function () {
      assert.doesNotThrow(() => this.pending.reject('foo'));
    });
  });

  describe('fulfill', function () {
    it('should resolve', function () {
      const res = this.pending.call(noop);
      this.pending.fulfill('foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject with error', function () {
      const res = this.pending.call(noop);
      this.pending.fulfill('foo', new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should keep first value if fulfilled twice', function () {
      const res = this.pending.call(noop);
      this.pending.fulfill('foo');
      this.pending.fulfill('bar', new Error('err'));
      return assert.eventually.equal(res, 'foo');
    });
  });

  describe('isFulfilled', function () {
    it('should set after resolve', function () {
      assert.notOk(this.pending.isFulfilled);
      this.pending.call();
      assert.notOk(this.pending.isFulfilled);
      this.pending.resolve('foo');
      assert.ok(this.pending.isFulfilled);
    });

    it('should set after manual reject', function () {
      assert.notOk(this.pending.isFulfilled);
      const res = this.pending.call();
      assert.notOk(this.pending.isFulfilled);
      this.pending.reject('foo');
      assert.ok(this.pending.isFulfilled);
      return assert.isRejected(res, 'foo');
    });

    it('should set after reject by error in fn', function () {
      assert.notOk(this.pending.isFulfilled);
      const res = this.pending.call(() => {
        throw new Error('err');
      });
      assert.ok(this.pending.isFulfilled);
      return assert.isRejected(res, 'err');
    });
  });

  describe('onFulfilled', function () {
    it('should call after resolve', function () {
      let a = 0;
      this.pending.onFulfilled = () => a++;
      this.pending.call();
      this.pending.resolve('foo');
      assert.equal(a, 1);
    });

    it('should set after reject', function () {
      let a = 0;
      this.pending.onFulfilled = () => a++;
      this.pending.call().catch(noop);
      this.pending.reject('foo');
      assert.equal(a, 1);
    });

    it('should set after reject (by error in fn)', function () {
      let a = 0;
      this.pending.onFulfilled = () => a++;
      this.pending.call(() => { throw new Error('err'); }).catch(noop);
      assert.equal(a, 1);
    });
  });

  describe('reset', function () {
    it('should reset resolved promise', function () {
      this.pending.call();
      this.pending.resolve();
      this.pending.reset();
      assert.equal(this.pending.isResolved, false);
    });

    it('should reject pending promise', function () {
      const res = this.pending.call(noop);
      this.pending.reset();
      return assert.isRejected(res, 'Promise rejected by reset');
    });

    it('should reject pending promise with custom message', function () {
      const res = this.pending.call(noop);
      this.pending.reset(new Error('err'));
      return assert.isRejected(res, 'err');
    });
  });

  describe('timeout', function () {
    it('should resolve before timeout', function () {
      const res = this.pending.call(noop, 10);
      setTimeout(() => this.pending.resolve('foo'), 5);
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject after timeout', function () {
      const res = this.pending.call(noop, 10);
      setTimeout(() => this.pending.resolve('foo'), 20);
      return assert.isRejected(res, 'Promise rejected by timeout (10 ms)');
    });
  });
});
