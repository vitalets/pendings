/**
 * Controls list of pending promises.
 */

'use strict';

const promiseFinally = require('promise.prototype.finally');
const Pending = require('./pending');

class Pendings {
  /**
   * Constructor.
   *
   * @param {Object} [options]
   * @param {String} [options.idPrefix=''] prefix for generated IDs
   * @param {Number} [options.timeout=0] default timeout for all promises
   */
  constructor(options) {
    options = options || {};
    this._timeout = options.timeout || 0;
    this._idPrefix = options.idPrefix || '';
    this._map = Object.create(null);
  }

  /**
   * Calls `fn` and returns new promise. `fn` gets generated unique `id` as parameter.
   *
   * @param {Function} fn
   * @param {Object} [options]
   * @param {Number} [options.timeout] custom timeout for particular promise
   * @returns {Promise}
   */
  add(fn, options) {
    const id = this.generateId();
    return this.set(id, fn, options);
  }

  /**
   * Calls `fn` and returns new promise with specified `id`.
   *
   * @param {String} id
   * @param {Function} fn
   * @param {Object} [options]
   * @param {Number} [options.timeout] custom timeout for particular promise
   * @returns {Promise}
   */
  set(id, fn, options) {
    if (!this.has(id)) {
      const pending = this._map[id] = new Pending();
      const timeout = this._getTimeout(options);
      const promise = pending.call(() => fn(id), timeout);
      pending.finalPromise = promiseFinally(promise, () => delete this._map[id]);
    }
    return this.getPromise(id);
  }

  /**
   * Checks if pending promise with specified `id` exists.
   *
   * @param {String} id
   * @returns {Boolean}
   */
  has(id) {
    return Boolean(this._map[id]);
  }

  /**
   * Resolves pending promise by `id` with specified `value`.
   * Throws if promise does not exist.
   *
   * @param {String} id
   * @param {*} [value]
   */
  resolve(id, value) {
    const pending = this._get(id, {throws: true});
    pending.resolve(value);
  }

  /**
   * Rejects pending promise by `id` with specified `reason`.
   * Throws if promise does not exist.
   *
   * @param {String} id
   * @param {*} [reason]
   */
  reject(id, reason) {
    const pending = this._get(id, {throws: true});
    pending.reject(reason);
  }

  /**
   * Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
   * Throws if promise does not exist.
   *
   * @param {String} id
   * @param {*} [value]
   * @param {*} [reason]
   */
  fulfill(id, value, reason) {
    const pending = this._get(id, {throws: true});
    pending.fulfill(value, reason);
  }

  /**
   * Resolves pending promise by `id` with specified `value` if it exists.
   *
   * @param {String} id
   * @param {*} [value]
   */
  tryResolve(id, value) {
    const pending = this._get(id, {throws: false});
    if (pending) {
      pending.resolve(value);
    }
  }

  /**
   * Rejects pending promise by `id` with specified `reason` if it exists.
   *
   * @param {String} id
   * @param {*} [reason]
   */
  tryReject(id, reason) {
    const pending = this._get(id, {throws: false});
    if (pending) {
      pending.reject(reason);
    }
  }

  /**
   * Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
   *
   * @param {String} id
   * @param {*} [value]
   * @param {*} [reason]
   */
  tryFulfill(id, value, reason) {
    const pending = this._get(id, {throws: false});
    if (pending) {
      pending.fulfill(value, reason);
    }
  }

  /**
   * Rejects all pending promises with specified `reason`. Useful for cleanup.
   *
   * @param {*} [reason]
   */
  rejectAll(reason) {
    Object.keys(this._map).forEach(id => this.reject(id, reason));
  }

  /**
   * Returns promise of pending object with specified `id`.
   *
   * @param {String} id
   * @returns {Promise|undefined}
   */
  getPromise(id) {
    return this._map[id] && this._map[id].finalPromise;
  }

  /**
   * Generates unique ID. Can be overwritten.
   *
   * @returns {String}
   */
  generateId() {
    return `${this._idPrefix}${Date.now()}-${Math.random()}`;
  }

  _get(id, {throws}) {
    const pending = this._map[id];
    if (!pending && throws) {
      throw new Error(`Pending promise not found with id: ${id}`);
    } else {
      return pending;
    }
  }

  _getTimeout(options) {
    options = options || {};
    return options.timeout !== undefined ? options.timeout : this._timeout;
  }
}

module.exports = Pendings;
module.exports.Pending = Pending;
