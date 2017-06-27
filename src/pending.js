/**
 * Pending promise {resolve, reject} holder
 */

'use strict';

module.exports = class Pending {
  constructor() {
    this.resolve = null;
    this.reject = null;
  }

  call(fn, timeout) {
    timeout = timeout || 0;
    const promise = this._createPromise(fn);
    return timeout
      ? Promise.race([promise, wait(timeout)])
      : promise;
  }

  fulfill(error) {
    if (error) {
      this.reject(error);
    } else {
      this.resolve();
    }
  }

  _createPromise(fn) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      fn();
    });
  }
};

function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Rejected by timeout (${ms} ms)`));
    }, ms);
  });
}
