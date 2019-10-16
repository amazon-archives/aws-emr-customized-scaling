'use strict';

const scaleOut = require('../emr').scaleOut;
const expect = require('chai').expect;
const describe = require('mocha').describe;

describe('EMR Schedule', function() {
  this.timeout(10 * 60 * 1000);   // 增加 mocha timeout 时间

  describe('#scaleOut()', async function() {

    /* 正常请求 100 */
    it.only('should return OK', async function() {

      const result = await scaleOut();


      expect(result).to.equal('OK');
    });

  });
});
