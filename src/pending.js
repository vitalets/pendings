/**
 * Controls single pending promise.
 */

'use strict';

const promiseFinally = require('promise.prototype.finally');
const TimeoutError = require('./timeout-error');

class Pending {
  /**
   * Creates instance of single pending promise. It holds `resolve / reject` callbacks for future fulfillment.
   */
  constructor() {
    this._resolve = null;
    this._reject = null;
    this._isFulfilled = true;
    this._promise = null;
  }

  /**
   * Returns promise itself.
   *
   * @returns {Promise}
   */
  get promise() {
    return this._promise;
  }

  /**
   * Returns is promise fulfilled or not.
   *
   * @returns {Boolean}
   */
  get isFulfilled() {
    return this._isFulfilled;
  }

  /**
   * Calls `fn`, returns new promise and holds `resolve` / `reject` callbacks.
   * If `timeout` specified, the promise will be rejected after `timeout` with `PendingTimeoutError`.
   *
   * @param {Function} fn
   * @param {Number} [timeout=0]
   * @returns {Promise}
   */
  call(fn, timeout) {
    this._isFulfilled = false;
    this._createPromise(fn);
    if (timeout) {
      this._addTimeout(timeout);
    }
    this._addFinally();
    return this._promise;
  }

  /**
   * Resolves pending promise with specified `value`.
   *
   * @param {*} [value]
   */
  resolve(value) {
    this._resolve(value);
  }

  /**
   * Rejects pending promise with specified `reason`.
   *
   * @param {*} [reason]
   */
  reject(reason) {
    this._reject(reason);
  }

  /**
   * Rejects if `reason` is truthy, otherwise resolves with `value`.
   *
   * @param {*} [value]
   * @param {*} [reason]
   */
  fulfill(value, reason) {
    if (reason) {
      this.reject(reason);
    } else {
      this.resolve(value);
    }
  }

  _createPromise(fn) {
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      if (typeof fn === 'function') {
        fn();
      }
    });
  }

  _addTimeout(timeout) {
    const timeoutPromise = wait(timeout).then(() => Promise.reject(new TimeoutError(timeout)));
    this._promise = Promise.race([this._promise, timeoutPromise]);
  }

  _addFinally() {
    this._promise = promiseFinally(this._promise, () => this._isFulfilled = true);
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = Pending;
