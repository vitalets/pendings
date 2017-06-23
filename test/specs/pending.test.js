'use strict';

const Pending = require('../../src/pending');

describe('pending', function () {
  beforeEach(function () {
    this.pending = new Pending();
  });

  it('should return Promise', function () {
    const res = this.pending.call(() => {});
    assert(res instanceof Promise);
  });

  it('should call passed fn', function () {
    let a = 0;
    this.pending.call(() => a++);
    assert.equal(a, 1);
  });

  it('should reject in case of error in fn', function () {
    const res = this.pending.call(() => {throw new Error('err');});
    assert.isRejected(res, 'err');
  });

  it('should reject directly', function () {
    const res = this.pending.call(() => {});
    this.pending.reject(new Error('err'));
    assert.isRejected(res, 'err');
  });

  it('should resolve directly', function () {
    const res = this.pending.call(() => {});
    this.pending.resolve(123);
    assert.eventually.equal(res, 123);
  });

  it('should fulfill to resolved', function () {
    const res = this.pending.call(() => {});
    this.pending.fulfill();
    assert.eventually.equal(res, undefined);
  });

  it('should fulfill to rejected with error', function () {
    const res = this.pending.call(() => {});
    this.pending.fulfill(new Error('err'));
    assert.isRejected(res, 'err');
  });

  it('should not throw if resolved twice', function () {
    const res = this.pending.call(() => {});
    this.pending.resolve(123);
    this.pending.resolve(456);
    assert.eventually.equal(res, 123);
  });
});
