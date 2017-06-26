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
      assert.isRejected(res, 'err');
    });

    it('should reject directly', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.reject(id, new Error('err'));
      assert.isRejected(res, 'err');
    });

    it('should resolve directly', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.resolve(id, 123);
      assert.eventually.equal(res, 123);
    });

    it('should fulfill to resolved', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.fulfill(id);
      assert.eventually.equal(res, undefined);
    });

    it('should fulfill to rejected with error', function () {
      let id;
      const res = this.pendings.add(pid => id = pid);
      this.pendings.fulfill(id, new Error('err'));
      assert.isRejected(res, 'err');
    });

    it('should delete promise after resolve', function () {
      let id;
      this.pendings.add(pid => id = pid);
      this.pendings.resolve(id, 123);
      assert.throws(() => this.pendings.resolve(id, 456), /Pending promise with id .+ not found/);
    });
  });

  describe('set', function () {
    it('should return Promise', function () {
      const res = this.pendings.set(1, () => {});
      assert(res instanceof Promise);
    });

    it('should call passed fn', function () {
      let a = 0;
      this.pendings.set(1, () => a++);
      assert.equal(a, 1);
    });

    it('should reject in case of error in fn', function () {
      const res = this.pendings.set(1, () => {throw new Error('err');});
      assert.isRejected(res, 'err');
    });

    it('should reject directly', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.reject(1, new Error('err'));
      assert.isRejected(res, 'err');
    });

    it('should resolve directly', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.resolve(1, 123);
      assert.eventually.equal(res, 123);
    });

    it('should fulfill to resolved', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.fulfill(1);
      assert.eventually.equal(res, undefined);
    });

    it('should fulfill to rejected with error', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.fulfill(1, new Error('err'));
      assert.isRejected(res, 'err');
    });

    it('should delete promise after resolve', function () {
      this.pendings.set(1, () => {});
      this.pendings.resolve(1, 1);
      assert.throws(() => this.pendings.resolve(1, 456), /Pending promise with id 1 not found/);
    });

    it('should throw if called with the same id', function () {
      this.pendings.set(1, () => {});
      const res = this.pendings.set(1, () => {});
      return assert.isRejected(res, 'Promise with id 1 is already pending');
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
      this.pendings.set(1, () => {});
      this.pendings.resolve(1);
      assert.notOk(this.pendings.has(1));
    });

    it('should return false for rejected promise', function () {
      const res = this.pendings.set(1, () => {});
      this.pendings.reject(1);
      assert.isRejected(res);
      assert.notOk(this.pendings.has(1));
    });
  });

  it('should throw for invalid id', function () {
    assert.throws(() => this.pendings.resolve('id123', 123), /Pending promise with id .+ not found/);
    assert.throws(() => this.pendings.reject('id123', 123), /Pending promise with id .+ not found/);
    assert.throws(() => this.pendings.fulfill('id123', 123), /Pending promise with id .+ not found/);
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
