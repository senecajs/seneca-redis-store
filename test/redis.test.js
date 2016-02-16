'use strict'

var Seneca = require('seneca')
var Shared = require('seneca-store-test')
var Lab = require('lab')
var lab = exports.lab = Lab.script()

var si = Seneca()

si.use('..', {uri: 'redis://localhost:6379'})

var describe = lab.describe

describe('redis-basic', function () {
  Shared.basictest({
    seneca: si,
    script: lab
  })
})
