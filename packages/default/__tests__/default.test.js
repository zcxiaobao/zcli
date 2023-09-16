'use strict';

const default = require('..');
const assert = require('assert').strict;

assert.strictEqual(default(), 'Hello from default');
console.info('default tests passed');
