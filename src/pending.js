/**
 * Controls single pending promise.
 */

'use strict';

const TimeoutError = require('./timeout-error');
const {mergeOptions} = require('./utils');

const AUTO_RESET = {
  NEVER: 'never',
  FULFILLED: 'fulfilled',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

const DEFAULT_OPTIONS = {
  timeout: 0,
  autoReset: AUTO_RESET.NEVER,
};

class Pending {
  /**
   * Creates instance of single pending promise. It holds `resolve / reject` callbacks for future fulfillment.
   * @param {Object} [options]
   * @param {Number} [options.timeout=0]
   * @param {String} [options.autoReset='never'] Condition for auto-reset. It is important for the result of
   * [.call()](#Pending+call) method:
   * <ul>
   * <li>**never**: never reset, so `.call()` always returns existing promise while it is pending and when
   * fulfilled</li>
   * <li>**fufilled**: reset when fulfilled, so `.call()` returns existing promise while it is pending and creates
   * new promise when fulfilled</li>
   * <li>**rejected**: reset only rejected, so `.call()` returns existing promise while it is pending or when
   * resolved and creates new promise when rejected</li>
   * <li>**resolved**: reset only resolved, so `.call()` returns existing promise while it is pending or when
   * rejected and creates new promise when resolved</li>
   * </ul>
   */
  constructor(options) {
    this._options = mergeOptions(DEFAULT_OPTIONS, options);
    this._resolve = null;
    this._reject = null;
    // it seems that isPending can be calculated as `Boolean(this._promise) && !this.isFulfilled`,
    // but it is not true: if call(fn) throws error in the same tick, `this._promise` is yet undefined.
    this._isPending = false;
    this._isResolved = false;
    this._isRejected = false;
    this._value = undefined;
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
   * Returns value with that promise was fulfilled (resolved or rejected).
   *
   * @returns {*}
   */
  get value() {
    return this._value;
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
   * Returns true if promise is pending.
   *
   * @returns {Boolean}
   */
  get isPending() {
    return this._isPending;
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
   * To reset this behavior use `.reset()`. If `options.timeout` is specified, the promise will be automatically
   * rejected after `timeout` milliseconds with `TimeoutError`.
   *
   * @param {Function} fn
   * @param {Object} [options]
   * @param {Number} [options.timeout=0] timeout after which promise will be automatically rejected
   * @returns {Promise}
   */
  call(fn, options) {
    if (this._isPending || this.isFulfilled) {
      return this._promise;
    } else {
      this.reset();
      this._callOptions = mergeOptions(this._options, options);
      this._initPromise(fn);
      this._initTimer();
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
      this._preFulfill();
      this._isResolved = true;
      this._value = value;
      this._resolve(value);
      this._postFulfill();
    }
  }

  /**
   * Rejects pending promise with specified `value`.
   *
   * @param {*} [value]
   */
  reject(value) {
    if (this._isPending) {
      this._preFulfill();
      this._isRejected = true;
      this._value = value;
      this._reject(value);
      this._postFulfill();
    }
  }

  /**
   * Helper method: rejects if `rejectValue` is truthy, otherwise resolves with `resolveValue`.
   *
   * @param {*} [resolveValue]
   * @param {*} [rejectValue]
   */
  fulfill(resolveValue, rejectValue) {
    if (rejectValue) {
      this.reject(rejectValue);
    } else {
      this.resolve(resolveValue);
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
    this._value = undefined;
    this._clearTimer();
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

  _initTimer() {
    const timeout = this._callOptions.timeout;
    if (timeout) {
      this._timer = setTimeout(() => this.reject(new TimeoutError(timeout)), timeout);
    }
  }

  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _callFn(fn) {
    try {
      const res = fn();
      this._attachToFnPromise(res);
    } catch (e) {
      this.reject(e);
    }
  }

  _attachToFnPromise(p) {
    if (p && typeof p.then === 'function') {
      p.then(value => this.resolve(value), e => this.reject(e));
    }
  }

  _preFulfill() {
    this._isPending = false;
    this._clearTimer();
  }

  _postFulfill() {
    this._onFulfilled(this);
    this._applyAutoReset();
  }

  _applyAutoReset() {
    const {autoReset} = this._options;
    const needReset = [
      autoReset === AUTO_RESET.FULFILLED,
      this._isResolved && autoReset === AUTO_RESET.RESOLVED,
      this._isRejected && autoReset === AUTO_RESET.REJECTED
    ].some(Boolean);
    if (needReset) {
      this.reset();
    }
  }
}

module.exports = Pending;
