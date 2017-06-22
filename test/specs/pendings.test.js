'use strict';

const Pendings = require('../../src/index');

describe('pendings', function () {
  beforeEach(function () {
    this.pendings = new Pendings();
  });

  describe('add', function () {
    it('should return Promise', function () {
      const res = this.pendings.add(() => {});
      assert(res instanceof Promise);
    });
  });

});
