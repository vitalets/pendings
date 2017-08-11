/**
 * Controls list of pending promises.
 */

'use strict';

const Pending = require('./pending');

class Pendings {
  /**
   * Creates dynamic list of promises. When each promise if fulfilled it is remove from list.
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
   * If promise with such `id` already pending - it will be returned.
   *
   * @param {String} id
   * @param {Function} fn
   * @param {Object} [options]
   * @param {Number} [options.timeout] custom timeout for particular promise
   * @returns {Promise}
   */
  set(id, fn, options) {
    if (this.has(id)) {
      return this._map[id].promise;
    } else {
      const pending = this._map[id] = new Pending();
      const timeout = this._getTimeout(options);
      pending.onFulfilled = () => delete this._map[id];
      return pending.call(() => fn(id), timeout);
    }
  }

  /**
   * Checks if promise with specified `id` is pending.
   *
   * @param {String} id
   * @returns {Boolean}
   */
  has(id) {
    return Boolean(this._map[id]);
  }

  /**
   * Resolves pending promise by `id` with specified `value`.
   * Throws if promise does not exist or is already fulfilled.
   *
   * @param {String} id
   * @param {*} [value]
   */
  resolve(id, value) {
    if (this.has(id)) {
      this._map[id].resolve(value);
    } else {
      throw createNoPendingError(id);
    }
  }

  /**
   * Rejects pending promise by `id` with specified `reason`.
   * Throws if promise does not exist or is already fulfilled.
   *
   * @param {String} id
   * @param {*} [reason]
   */
  reject(id, reason) {
    if (this.has(id)) {
      this._map[id].reject(reason);
    } else {
      throw createNoPendingError(id);
    }
  }

  /**
   * Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
   * Throws if promise does not exist or is already fulfilled.
   *
   * @param {String} id
   * @param {*} [value]
   * @param {*} [reason]
   */
  fulfill(id, value, reason) {
    if (this.has(id)) {
      this._map[id].fulfill(value, reason);
    } else {
      throw createNoPendingError(id);
    }
  }

  /**
   * Resolves pending promise by `id` with specified `value` if it exists.
   *
   * @param {String} id
   * @param {*} [value]
   */
  tryResolve(id, value) {
    if (this.has(id)) {
      this._map[id].resolve(value);
    }
  }

  /**
   * Rejects pending promise by `id` with specified `reason` if it exists.
   *
   * @param {String} id
   * @param {*} [reason]
   */
  tryReject(id, reason) {
    if (this.has(id)) {
      this._map[id].reject(reason);
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
    if (this.has(id)) {
      this._map[id].fulfill(value, reason);
    }
  }

  /**
   * Rejects all pending promises with specified `reason`. Useful for cleanup.
   *
   * @param {*} [reason]
   */
  rejectAll(reason) {
    Object.keys(this._map).forEach(id => this.tryReject(id, reason));
  }

  /**
   * Generates unique ID. Can be overwritten.
   *
   * @returns {String}
   */
  generateId() {
    return `${this._idPrefix}${Date.now()}-${Math.random()}`;
  }

  _getTimeout(options) {
    options = options || {};
    return options.timeout !== undefined ? options.timeout : this._timeout;
  }
}

function createNoPendingError(id) {
  return new Error(`Pending promise not found with id: ${id}`);
}

module.exports = Pendings;
