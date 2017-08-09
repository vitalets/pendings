/**
 * Controls single pending promise.
 */

'use strict';

const TimeoutError = require('./timeout-error');

class Pending {
  /**
   * Creates instance of single pending promise. It holds `resolve / reject` callbacks for future fulfillment.
   */
  constructor() {
    this._resolve = null;
    this._reject = null;
    this._isResolved = true;
    this._isRejected = false;
    this._promise = null;
    this._timer = null;
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
   * Returns true if promise resolved.
   *
   * @returns {Boolean}
   */
  get isResolved() {
    return this._isResolved;
  }

  /**
   * Returns true if promise rejected.
   *
   * @returns {Boolean}
   */
  get isRejected() {
    return this._isRejected;
  }

  /**
   * Returns true if promise fulfilled (resolved or rejected).
   *
   * @returns {Boolean}
   */
  get isFulfilled() {
    return this._isResolved || this._isRejected;
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
    if (this.isFulfilled) {
      this._reset();
      this._createPromise(fn, timeout);
    }
    return this._promise;
  }

  /**
   * Resolves pending promise with specified `value`.
   *
   * @param {*} [value]
   */
  resolve(value) {
    if (!this.isFulfilled) {
      this._isResolved = true;
      this._clearTimer();
      this._resolve(value);
    }
  }

  /**
   * Rejects pending promise with specified `reason`.
   *
   * @param {*} [reason]
   */
  reject(reason) {
    if (!this.isFulfilled) {
      this._isRejected = true;
      this._clearTimer();
      this._reject(reason);
    }
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

  _createPromise(fn, timeout) {
    this._initPromise(fn);
    if (timeout) {
      this._initTimer(timeout);
    }
  }

  _initPromise(fn) {
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      if (typeof fn === 'function') {
        this._callFn(fn);
      }
    });
  }

  _callFn(fn) {
    try {
      fn();
    } catch (e) {
      this.reject(e);
    }
  }

  _initTimer(timeout) {
    this._timer = setTimeout(() => this.reject(new TimeoutError(timeout)), timeout);
  }

  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _reset() {
    this._isResolved = false;
    this._isRejected = false;
  }
}

module.exports = Pending;
