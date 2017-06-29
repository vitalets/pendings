'use strict';

const Pendings = require('../../src/index');

describe('pendings', function () {
  beforeEach(function () {
    this.pendings = new Pendings();
  });

  describe('add', function () {
    it('should return Promise', function () {
      const res = this.pendings.add(() => {});
      assert(res instanceof Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pendings.add(() => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = this.pendings.add(() => {throw new Error('err');});
      return assert.isRejected(res, 'err');
    });

    it('should resolve directly', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.resolve(id, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject directly', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.reject(id, new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should fulfill to resolved', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.fulfill(id, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should fulfill to rejected with error', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.fulfill(id, 'foo', new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should delete promise after resolve', function () {
      let id;
      const p = this.pendings.add(pid => id = pid);
      this.pendings.resolve(id, 'foo');
      return assert.isFulfilled(p)
        .then(() => assert.notOk(this.pendings.has(id)));
    });

    it('should resolve before timeout', function () {
      let id;
      const res = this.pendings.add(pid => id = pid, {timeout: 10});
      setTimeout(() => this.pendings.resolve(id, 'foo'), 5);
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject after timeout', function () {
      let id;
      const res = this.pendings.add(pid => id = pid, {timeout: 10});
      setTimeout(() => this.pendings.resolve(id, 'foo'), 20);
      return assert.isRejected(res, 'Promise rejected by timeout (10 ms)');
    });
  });

  describe('set', function () {
    it('should return Promise', function () {
      const res = this.pendings.set(1, () => {});
      assert.instanceOf(res, Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pendings.set(1, () => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = this.pendings.set(1, () => {throw new Error('err');});
      return assert.isRejected(res, 'err');
    });

    it('should reject directly', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.reject(1, new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should resolve directly', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.resolve(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should fulfill to resolved', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.fulfill(1, 'foo');
      return assert.eventually.equal(res, 'foo');
    });

    it('should fulfill to rejected with error', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.fulfill(1, 'foo', new Error('err'));
      return assert.isRejected(res, 'err');
    });

    it('should delete promise after resolve', function () {
      const p = this.pendings.set(1, () => {});
      this.pendings.resolve(1, 1);
      return assert.isFulfilled(p)
        .then(() => assert.notOk(this.pendings.has(1)));
    });

    it('should return the same promise for second call with the same id', function () {
      const p1 = this.pendings.set(1, () => {});
      const p2 = this.pendings.set(1, () => {});
      assert.equal(p1, p2);
    });

    it('should resolve before timeout', function () {
      const res = this.pendings.set(1, () => {}, {timeout: 10});
      setTimeout(() => this.pendings.resolve(1, 'foo'), 5);
      return assert.eventually.equal(res, 'foo');
    });

    it('should reject after timeout', function () {
      const res = this.pendings.set(1, () => {}, {timeout: 10});
      setTimeout(() => this.pendings.resolve(1, 'foo'), 20);
      return assert.isRejected(res, 'Promise rejected by timeout (10 ms)');
    });

    it('should reject after default timeout', function () {
      const pendings = new Pendings({timeout: 10});
      const res = pendings.set(1, () => {});
      setTimeout(() => pendings.resolve(1, 'foo'), 20);
      return assert.isRejected(res, 'Promise rejected by timeout (10 ms)');
    });

    it('should overwrite default timeout', function () {
      const pendings = new Pendings({timeout: 20});
      const res = pendings.set(1, () => {}, {timeout: 10});
      setTimeout(() => pendings.resolve(1, 'foo'), 15);
      return assert.isRejected(res, 'Promise rejected by timeout (10 ms)');
    });
  });

  describe('has', function () {
    it('should return false for non-existing promise', function () {
      assert.notOk(this.pendings.has(1));
    });

    it('should return true for pending promise', function () {
      this.pendings.set(1, () => {});
      assert.ok(this.pendings.has(1));
    });

    it('should return false for resolved promise', function () {
      const p = this.pendings.set(1, () => {});
      this.pendings.resolve(1);
      return assert.isFulfilled(p)
        .then(() => assert.notOk(this.pendings.has(1)));
    });

    it('should return false for rejected promise', function () {
      const p = this.pendings.set(1, () => {});
      this.pendings.reject(1);
      return assert.isRejected(p)
        .then(() => assert.notOk(this.pendings.has(1)));
    });
  });

  describe('getPromise', function () {
    it('should return promise of existing pending', function () {
      const p = this.pendings.set(1, () => {});
      assert.equal(p, this.pendings.getPromise(1));
    });

    it('should return promise of timeouted pending', function () {
      const p = this.pendings.set(1, () => {}, {timeout: 10});
      assert.equal(p, this.pendings.getPromise(1));
      return assert.isRejected(p);
    });

    it('should return undefined for non-existing pending', function () {
      assert.equal(this.pendings.getPromise(1));
    });
  });

  it('should not throw for invalid id', function () {
    assert.doesNotThrow(() => this.pendings.resolve('id123', 'foo'));
    assert.doesNotThrow(() => this.pendings.reject(123, 'foo'));
    assert.doesNotThrow(() => this.pendings.fulfill('id123', 'foo'));
  });

  it('should should overwrite generateId method', function () {
    this.pendings.generateId = () => 1;
    this.pendings.add(id => assert.equal(id, 1));
  });

  it('should export Pending as prop', function () {
    assert.ok(Pendings.Pending);
  });

  it('should reject all', function () {
    const p1 = this.pendings.add(() => {});
    const p2 = this.pendings.set(1, () => {});
    this.pendings.rejectAll('err');
    return Promise.all([
      assert.isRejected(p1, 'err'),
      assert.isRejected(p2, 'err'),
    ]);
  });
});
