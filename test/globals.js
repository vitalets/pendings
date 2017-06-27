'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

global.assert = chai.assert;
global.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
