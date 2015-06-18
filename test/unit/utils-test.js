'use strict';

var utils = require('../../').utils;
var assert = require('chai').assert;

suite('Utils', () => {
  test('create a random string', () => {
    let test1 = utils.getRandomString();
    assert.isString(test1);
    assert.equal(test1, test1.match(/^[0-9a-z]{8}$/)[0]);

    let test2 = utils.getRandomString(16);
    assert.isString(test2);
    assert.equal(test2, test2.match(/^[0-9a-z]{16}$/)[0]);
  });
});
