'use strict';

const Pending = require('../../src/pending');

describe('pending', function () {
  beforeEach(function () {
    this.pending = new Pending();
  });

  it('should return Promise', function () {
    const res = this.pending.call(() => {});
    assert.instanceOf(res, Promise);
  });

  it('should call passed fn', function () {
    let a = 0;
    this.pending.call(() => a++);
    assert.equal(a, 1);
  });

  it('should allow to call without fn', function () {
    const res = this.pending.call();
    this.pending.resolve('foo');
    return assert.eventually.equal(res, 'foo');
  });

  it('should reject in case of error in fn', function () {
    const res = this.pending.call(() => {throw new Error('err');});
    return assert.isRejected(res, 'err');
  });

  it('should reject directly', function () {
    const res = this.pending.call(() => {});
    this.pending.reject(new Error('err'));
    return assert.isRejected(res, 'err');
  });

  it('should resolve directly', function () {
    const res = this.pending.call(() => {});
    this.pending.resolve('foo');
    return assert.eventually.equal(res, 'foo');
  });

  it('should fulfill to resolved', function () {
    const res = this.pending.call(() => {});
    this.pending.fulfill('foo');
    return assert.eventually.equal(res, 'foo');
  });

  it('should fulfill to rejected with error', function () {
    const res = this.pending.call(() => {});
    this.pending.fulfill('foo', new Error('err'));
    return assert.isRejected(res, 'err');
  });

  it('should not throw if resolved twice', function () {
    const res = this.pending.call(() => {});
    this.pending.resolve('foo');
    this.pending.resolve('bar');
    return assert.eventually.equal(res, 'foo');
  });

  it('should set isFulfilled after resolve', function () {
    assert.ok(this.pending.isFulfilled);
    const res = this.pending.call();
    assert.notOk(this.pending.isFulfilled);
    this.pending.resolve('foo');
    return assert.isFulfilled(res).then(() => assert.ok(this.pending.isFulfilled));
  });

  it('should set isFulfilled after reject', function () {
    assert.ok(this.pending.isFulfilled);
    const res = this.pending.call();
    assert.notOk(this.pending.isFulfilled);
    this.pending.reject('foo');
    return assert.isRejected(res, 'foo');
  });
});
