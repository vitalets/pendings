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
      assert(a === 1);
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
      assert(a === 1);
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
      return assert.isRejected(res, 'Promise with id 1 already pending');
    });
  });

  it('should throw for invalid id', function () {
    assert.throws(() => this.pendings.resolve('id123', 123), /Pending promise with id .+ not found/);
    assert.throws(() => this.pendings.reject('id123', 123), /Pending promise with id .+ not found/);
    assert.throws(() => this.pendings.fulfill('id123', 123), /Pending promise with id .+ not found/);
  });

});
