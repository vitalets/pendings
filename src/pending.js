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
    // it seems that isPending can be calculated as `Boolean(this._promise) && !this.isFulfilled`,
    // but it is not true: if call(fn) throws error in the same tick, `this._promise` is yet undefined.
    this._isPending = false;
    this._isResolved = false;
    this._isRejected = false;
    this._promise = null;
    this._timer = null;
    this._onFulfilled = () => {};
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
   * Callback called when promise is fulfilled (resolved or rejected).
   *
   * @param {Function} fn
   */
  set onFulfilled(fn) {
    if (typeof fn === 'function') {
      this._onFulfilled = fn;
    } else {
      throw new Error('onFulfilled should be a function.');
    }
  }

  /**
   * For the first time this method calls `fn` and returns new promise. Also holds `resolve` / `reject` callbacks
   * to allow fulfill promise via `pending.resolve()` and `pending.reject()`. All subsequent calls of `.call(fn)`
   * will return the same promise, which can be still pending or already fulfilled.
   * To reset this behavior use `.reset()`. If `timeout` is specified, the promise will be automatically rejected
   * after `timeout` milliseconds with `PendingTimeoutError`.
   *
   * @param {Function} fn
   * @param {Number} [timeout=0]
   * @returns {Promise}
   */
  call(fn, timeout) {
    if (this._isPending || this.isFulfilled) {
      return this._promise;
    } else {
      this.reset();
      this._createPromise(fn, timeout);
      return this._promise;
    }
  }

  /**
   * Resolves pending promise with specified `value`.
   *
   * @param {*} [value]
   */
  resolve(value) {
    if (this._isPending) {
      this._isPending = false;
      this._isResolved = true;
      this._clearTimer();
      this._resolve(value);
      this._onFulfilled(this);
    }
  }

  /**
   * Rejects pending promise with specified `reason`.
   *
   * @param {*} [reason]
   */
  reject(reason) {
    if (this._isPending) {
      this._isPending = false;
      this._isRejected = true;
      this._clearTimer();
      this._reject(reason);
      this._onFulfilled(this);
    }
  }

  /**
   * Helper method: rejects if `reason` is truthy, otherwise resolves with `value`.
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

  /**
   * Resets to initial state.
   *
   * @param {Error} [error] custom rejection error if promise is in pending state.
   */
  reset(error) {
    if (this._isPending) {
      error = error || new Error('Promise rejected by reset');
      this.reject(error);
    }
    this._promise = null;
    this._isPending = false;
    this._isResolved = false;
    this._isRejected = false;
    this._clearTimer();
  }

  _createPromise(fn, timeout) {
    this._initPromise(fn);
    if (timeout) {
      this._initTimer(timeout);
    }
  }

  _initPromise(fn) {
    this._promise = new Promise((resolve, reject) => {
      this._isPending = true;
      this._resolve = resolve;
      this._reject = reject;
      if (typeof fn === 'function') {
        this._callFn(fn);
      }
    });
  }

  _callFn(fn) {
    try {
      const res = fn();
      this._proxyPromise(res);
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

  _proxyPromise(p) {
    if (p && typeof p.then === 'function') {
      p.then(value => this.resolve(value), e => this.reject(e));
    }
  }
}

module.exports = Pending;
