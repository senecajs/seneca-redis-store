'use strict'

var Seneca = require('seneca')
var Shared = require('seneca-store-test')
var Lab = require('lab')
var lab = (exports.lab = Lab.script())

var before = lab.before
var describe = lab.describe

var si = Seneca()

if (si.version >= '2.0.0') {
  si.use('seneca-entity')
}

si.use('..', { uri: 'redis://localhost:6379' })

describe('redis-basic', function() {
  before({}, function(done) {
    si.ready(done)
  })

  Shared.basictest({
    seneca: si,
    script: lab
  })
})
