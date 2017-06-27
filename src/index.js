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
    const pending = this._get(id);
    if (pending) {
      pending.resolve(data);
    }
  }

  reject(id, reason) {
    const pending = this._get(id);
    if (pending) {
      pending.reject(reason);
    }
  }

  fulfill(id, error) {
    const pending = this._get(id);
    if (pending) {
      pending.fulfill(error);
    }
  }

  rejectAll(reason) {
    Object.keys(this._map).forEach(id => this.reject(id, reason));
  }

  generateId() {
    return `${Date.now()}-${Math.random()}`;
  }

  _get(id) {
    const pending = this._map[id];
    if (pending) {
      delete this._map[id];
      return pending;
    }
  }
}

module.exports = Pendings;
module.exports.Pending = Pending;
