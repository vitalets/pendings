/**
 * Pending promise {resolve, reject} holder
 */

'use strict';

module.exports = class Pending {
  constructor() {
    this.resolve = null;
    this.reject = null;
  }

  call(fn) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      fn();
    });
  }

  fulfill(error) {
    if (error) {
      this.reject(error);
    } else {
      this.resolve();
    }
  }
};
