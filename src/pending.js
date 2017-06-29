/**
 * Controls single pending promise.
 */

'use strict';

module.exports = class Pending {
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
   * @returns {Promise}
   */
  call(fn) {
    this._isFulfilled = false;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      if (fn) {
        fn();
      }
    });
    return this._promise;
  }

  /**
   * Resolves pending promise with specified `value`.
   *
   * @param {*} [value]
   */
  resolve(value) {
    this._isFulfilled = true;
    this._resolve(value);
  }

  /**
   * Rejects pending promise with specified `reason`.
   *
   * @param {*} [reason]
   */
  reject(reason) {
    this._isFulfilled = true;
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
};
