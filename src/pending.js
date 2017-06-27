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
  }

  /**
   * Calls `fn`, returns new promise and holds `resolve` / `reject` callbacks.
   *
   * @param {Function} fn
   * @returns {Promise}
   */
  call(fn) {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      fn();
    });
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
   * Rejects pending promise if `reason` is specified, otherwise resolves with empty value.
   *
   * @param {*} [reason]
   */
  fulfill(reason) {
    if (reason) {
      this.reject(reason);
    } else {
      this.resolve();
    }
  }
};
