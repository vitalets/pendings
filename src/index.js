/**
 * Manipulate list of pending promises
 */

'use strict';

const Pending = require('./pending');

class Pendings {
  constructor() {
    this._map = Object.create(null);
  }

  add(fn) {
    const id = this.generateId();
    return this.set(id, fn);
  }

  set(id, fn) {
    const pending = new Pending();
    return pending.call(() => {
      if (this._map[id]) {
        throw new Error(`Promise with id ${id} is already pending`);
      }
      this._map[id] = pending;
      try {
        fn(id);
      } catch (e) {
        this.reject(id, e);
      }
    });
  }

  has(id) {
    return Boolean(this._map[id]);
  }

  resolve(id, data) {
    this._get(id).resolve(data);
  }

  reject(id, reason) {
    this._get(id).reject(reason);
  }

  fulfill(id, error) {
    this._get(id).fulfill(error);
  }

  generateId() {
    return `${Date.now()}-${Math.random()}`;
  }

  _get(id) {
    const pending = this._map[id];
    if (!pending) {
      throw new Error(`Pending promise with id ${id} not found`);
    } else {
      delete this._map[id];
    }
    return pending;
  }
}

module.exports = Pendings;
module.exports.Pending = Pending;
