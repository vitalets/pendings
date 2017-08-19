/**
 * Controls list of pending promises.
 */

'use strict';

const Pending = require('./pending');
const {mergeOptions} = require('./utils');

const DEFAULT_OPTIONS = {
  autoRemove: false,
  timeout: 0,
  idPrefix: '',
};

class Pendings {
  /**
   * Manipulation of list of promises.
   *
   * @param {Object} [options]
   * @param {Number} [options.autoRemove=false] automatically remove fulfilled promises from list
   * @param {Number} [options.timeout=0] default timeout for all promises
   * @param {String} [options.idPrefix=''] prefix for generated promise IDs
   */
  constructor(options) {
    this._options = mergeOptions(DEFAULT_OPTIONS, options);
    this._map = Object.create(null);
    this._waitingAll = new Pending({autoReset: 'never'});
  }

  /**
   * Returns count of pending / fulfilled promises in the list.
   *
   * @returns {Number}
   */
  get count() {
    return Object.keys(this._map).length;
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
   * @param {Number} [options.timeout=0] custom timeout for particular promise
   * @returns {Promise}
   */
  set(id, fn, options) {
    if (this.has(id)) {
      return this._map[id].promise;
    } else {
      const {timeout} = mergeOptions(this._options, options);
      const pending = this._map[id] = new Pending({timeout});
      pending.onFulfilled = () => this._onFulfilled(id);
      return pending.call(() => fn(id));
    }
  }

  /**
   * Checks if promise with specified `id` is exists in the list.
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
   * Rejects pending promise by `id` with specified `value`.
   * Throws if promise does not exist or is already fulfilled.
   *
   * @param {String} id
   * @param {*} [value]
   */
  reject(id, value) {
    if (this.has(id)) {
      this._map[id].reject(value);
    } else {
      throw createNoPendingError(id);
    }
  }

  /**
   * Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
   * Throws if promise does not exist or is already fulfilled.
   *
   * @param {String} id
   * @param {*} [resolveValue]
   * @param {*} [rejectValue]
   */
  fulfill(id, resolveValue, rejectValue) {
    if (this.has(id)) {
      this._map[id].fulfill(resolveValue, rejectValue);
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
   * Rejects pending promise by `id` with specified `value` if it exists.
   *
   * @param {String} id
   * @param {*} [value]
   */
  tryReject(id, value) {
    if (this.has(id)) {
      this._map[id].reject(value);
    }
  }

  /**
   * Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
   *
   * @param {String} id
   * @param {*} [resolveValue]
   * @param {*} [rejectValue]
   */
  tryFulfill(id, resolveValue, rejectValue) {
    if (this.has(id)) {
      this._map[id].fulfill(resolveValue, rejectValue);
    }
  }

  /**
   * Rejects all pending promises with specified `value`. Useful for cleanup.
   *
   * @param {*} [value]
   */
  rejectAll(value) {
    Object.keys(this._map).forEach(id => this.tryReject(id, value));
  }

  /**
   * Waits for all promises to fulfill and returns object with resolved/rejected values.
   *
   * @returns {Promise} promise resolved with object `{resolved: {id: value, ...}, rejected: {id: value, ...}}`
   */
  waitAll() {
    return this._waitingAll.call(() => this._checkAllFulfilled());
  }

  /**
   * Removes all items from list.
   * If there is waitAll promise - it will be resolved with empty results.
   */
  clear() {
    this._map = Object.create(null);
    if (this._waitingAll.isPending) {
      this._checkAllFulfilled();
    }
  }

  /**
   * Generates unique ID. Can be overwritten.
   *
   * @returns {String}
   */
  generateId() {
    return `${this._options.idPrefix}${Date.now()}-${Math.random()}`;
  }

  _onFulfilled(id) {
    if (this._options.autoRemove) {
      delete this._map[id];
    }
    if (this._waitingAll.isPending) {
      this._checkAllFulfilled();
    }
  }

  _getTimeout(options) {
    return options && options.timeout !== undefined ? options.timeout : this._options.timeout;
  }

  _checkAllFulfilled() {
    const allFulfilled = Object.keys(this._map).every(id => this._map[id].isFulfilled);
    if (allFulfilled) {
      const result = this._getAllValues();
      this._waitingAll.resolve(result);
      this._waitingAll.reset();
    }
  }

  _getAllValues() {
    const result = {resolved: {}, rejected: {}};
    Object.keys(this._map).forEach(id => {
      const pending = this._map[id];
      result[pending.isResolved ? 'resolved' : 'rejected'][id] = pending.value;
    });
    return result;
  }
}

function createNoPendingError(id) {
  return new Error(`Pending promise not found with id: ${id}`);
}

module.exports = Pendings;
