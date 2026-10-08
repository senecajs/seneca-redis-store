'use strict'

const Seneca = require('seneca')
const Shared = require('seneca-store-test')
const Lab = require('@hapi/lab')
const lab = (exports.lab = Lab.script())

const before = lab.before
const after = lab.after
const describe = lab.describe

// Connection settings match docker-compose.yml; override for other setups.
const REDIS_HOST = process.env.SENECA_TEST_REDIS_HOST || '127.0.0.1'
const REDIS_PORT = process.env.SENECA_TEST_REDIS_PORT || '16380'

const si = Seneca({ legacy: false }).test()

if (si.version.startsWith('3.')) {
  si.use('seneca-promisify')
}

si.use('seneca-entity')
si.use('..', { uri: 'redis://' + REDIS_HOST + ':' + REDIS_PORT })

describe('redis-basic', function () {
  before(() => new Promise((resolve) => si.ready(resolve)))
  after(() => new Promise((resolve) => si.close(resolve)))

  Shared.basictest({
    seneca: si,
    script: lab,
  })
})
