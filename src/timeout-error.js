/**
 * Timeout error.
 */

'use strict';

class TimeoutError extends Error {
  /**
   * Timeout error for pending promise.
   * @param {Number} timeout
   */
  constructor(timeout) {
    const message = `Promise rejected by timeout (${timeout} ms)`;
    super(message);
    this.timeout = timeout;
  }
}

module.exports = TimeoutError;
