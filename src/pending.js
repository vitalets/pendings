/**
 * Controls single pending promise.
 */

'use strict';

const promiseFinally = require('promise.prototype.finally');

class Pending {
  /**
   * Constructor.
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
   *
   * @param {Function} fn
   * @param {Number} [timeout=0]
   * @returns {Promise}
   */
  call(fn, timeout) {
    this._isFulfilled = false;
    this._createPromise(fn);
    if (timeout) {
      this._wrapWithTimeout(timeout);
    }
    this._wrapWithFinally();
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
      if (fn) {
        fn();
      }
    });
  }

  _wrapWithTimeout(timeout) {
    const timeoutPromise = new Promise((resolve, reject) => setTimeout(() => {
      reject(new Error(`Promise rejected by timeout (${timeout} ms)`));
    }, timeout));
    this._promise = Promise.race([this._promise, timeoutPromise]);
  }

  _wrapWithFinally() {
    this._promise = promiseFinally(this._promise, () => this._isFulfilled = true);
  }
}

module.exports = Pending;
