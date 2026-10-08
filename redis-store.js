'use strict'

var Assert = require('assert')
var _ = require('lodash')
var Redis = require('redis')
var Uuid = require('node-uuid')
var NOSJ = require('nosj')

var NAME = 'redis-store'
var MIN_WAIT = 16
var MAX_WAIT = 65336

module.exports = function(opts) {
  var seneca = this
  var desc
  var minwait
  var dbConn = null
  var connectSpec = null
  var waitmillis = MAX_WAIT

  opts.minwait = opts.minwait || MIN_WAIT
  opts.maxwait = opts.maxwait || MAX_WAIT

  /**
   * check and report error conditions seneca.fail will execute the callback
   * in the case of an error. Optionally attempt reconnect to the store depending
   * on error condition
   */
  function error(args, err, cb) {
    if (err) {
      seneca.log.debug('error: ' + err)
      seneca.fail({ code: 'entity/error', store: NAME }, cb)

      if (
        'ECONNREFUSED' === err.code ||
        'notConnected' === err.message ||
        'Error: no open connections' === err
      ) {
        minwait = opts.minwait
        if (minwait) {
          reconnect(args)
        }
      }
      return true
    }
    return false
  }

  /**
   * attemp to reconnect to the store
   */
  // TODO: this is a function of the fw / subsystem NOT the store driver
  // drivers should be dumb!
  function reconnect(args) {
    configure(connectSpec, function(err) {
      if (err) {
        seneca.log.debug(
          'db reconnect (wait ' + waitmillis + 'ms) failed: ' + err
        )
        waitmillis = Math.min(2 * waitmillis, MAX_WAIT)
        setTimeout(function() {
          reconnect(args)
        }, waitmillis)
      } else {
        waitmillis = MIN_WAIT
        seneca.log.debug('reconnect ok')
      }
    })
  }

  /**
   * configure the store - create a new store specific connection object
   *
   * params:
   * spec - store specific configuration
   * cb - callback
   */
  function configure(spec, cb) {
    Assert(spec)
    Assert(cb)

    var conf = spec
    connectSpec = spec

    if (_.isString(conf)) {
      dbConn = Redis.createClient(conf)
      seneca.log.debug('db ' + conf + ' opened.')
    } else if (_.has(spec, 'uri')) {
      dbConn = Redis.createClient(conf.uri, conf.options)
      seneca.log.debug('db ' + conf.uri + ' opened.')
    } else {
      dbConn = Redis.createClient()
      seneca.log.debug('db localhost opened.')
    }

    dbConn.on('error', function(err) {
      seneca.fail({ code: 'seneca-redis/configure', message: err.message })
    })

    if (_.has(conf, 'db')) {
      dbConn.select(conf.db, function(err) {
        if (err) return cb(err)
        seneca.log.debug('selected db ' + conf.db)
      })
    }

    seneca.log.debug('init', 'db open', spec)
    cb(null)
  }

  /**
   * the simple db store interface returned to seneca
   */
  var store = {
    name: NAME,
    /**
     * close the connection
     *
     * params
     * cmd - optional close command parameters
     * cb - callback
     */
    close: function(cmd, cb) {
      Assert(cb)
      if (dbConn) {
        // close the connection
        dbConn.quit()
        dbConn = null
      }
      cb(null)
    },

    /**
     * save the data as specified in the entitiy block on the arguments object
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     */
    save: function(args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.ent)

      var ent = args.ent
      var table = tablename(ent)
      var entp = {}

      if (!ent.id) {
        if (ent.id$) {
          ent.id = ent.id$
        } else {
          ent.id = Uuid()
        }
      }

      var data = ent.data$(false)
      var merge = !(false === args.merge$ || false === opts.merge)

      function write(stored) {
        entp = NOSJ.stringify(stored)
        dbConn.hset(table, ent.id, entp, function(err, result) {
          if (!error(args, err, cb)) {
            seneca.log.debug('save', result)
            // Reply with a copy so later changes to either object stay apart.
            cb(null, ent.make$(NOSJ.parse(entp)))
          }
        })
      }

      if (!merge) {
        return write(data)
      }

      // Merge into the stored entity, as the seneca-store-test contract
      // expects: fields absent from the update are kept.
      dbConn.hget(table, ent.id, function(err, row) {
        if (!error(args, err, cb)) {
          write(Object.assign(row ? NOSJ.parse(row) : {}, data))
        }
      })
    },

    /**
     * load first matching item based on id
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     */
    load: function(args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)

      var qent = args.qent
      var q = _.clone(args.q)
      var table = tablename(qent)

      q.limit$ = 1

      if (!q.id) {
        store.list(args, function(err, list) {
          if (!error(args, err, cb)) {
            var ent = list[0] || null
            seneca.log.debug('load', ent)
            cb(err, ent)
          }
        })
      } else {
        dbConn.hget(table, q.id, function(err, row) {
          if (!error(args, err, cb)) {
            if (!row) {
              cb(null, null)
            } else {
              var ent = qent.make$(NOSJ.parse(row))
              seneca.log.debug('load', ent)
              cb(null, ent)
            }
          }
        })
      }
    },

    /**
     * return a list of object based on the supplied query, if no query is supplied
     * then all items are selected
     *
     * Notes: trivial implementation and unlikely to perform well due to list copy
     *        also only takes the first page of results from simple DB should in fact
     *        follow paging model
     *
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     * a=1, b=2 simple
     * next paging is optional in simpledb
     * limit$ ->
     * use native$
     */
    list: function(args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)

      var qent = args.qent
      var q = args.q
      var table = tablename(qent)

      dbConn.hgetall(table, function(err, results) {
        if (!error(args, err, cb)) {
          var list = []
          _.each(results, function(value) {
            var ent = qent.make$(NOSJ.parse(value))
            list.push(ent)
          })

          // Opaque queries (an id string or an array of ids) select by id.
          if (_.isString(q) || _.isArray(q)) {
            q = { id: q }
          }

          if (!_.isEmpty(q)) {
            list = _.filter(list, function(elem) {
              var match = true
              _.each(q, function(value, key) {
                // Query directives such as all$ or load$ are not fields.
                if (!isField(key)) return
                var computed = _.isArray(value)
                  ? _.includes(value, elem[key])
                  : elem[key] === value
                match = match && computed
              })
              return match
            })
          }
          cb(null, list)
        }
      })
    },

    /**
     * delete an item - fix this
     *
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     * { 'all$': true }
     */
    remove: function(args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)
      var qent = args.qent
      var q = args.q
      var table = tablename(qent)

      if (_.isString(q) || _.isArray(q)) {
        q = { id: q }
      }

      if (q.all$ && 0 === Object.keys(q).filter(isField).length) {
        // Nothing else to match: drop the whole hash. Deleted entities are
        // never returned for all$.
        return dbConn.del(table, function(err) {
          if (!error(args, err, cb)) {
            cb(null, null)
          }
        })
      }

      // Fast path: a query that is only a single id needs no hash scan.
      var fields = Object.keys(q).filter(isField)
      if (!q.all$ && 1 === fields.length && _.isString(q.id)) {
        var removeById = function(row) {
          dbConn.hdel(table, q.id, function(err, count) {
            if (!error(args, err, cb)) {
              cb(null, q.load$ && count ? qent.make$(NOSJ.parse(row)) : null)
            }
          })
        }
        if (!q.load$) return removeById(null)
        return dbConn.hget(table, q.id, function(err, row) {
          if (!error(args, err, cb)) {
            if (!row) return cb(null, null)
            removeById(row)
          }
        })
      }

      // Find the matching entities, then delete them: all matches for
      // all$, otherwise only the first one.
      store.list({ qent: qent, q: q }, function(err, elements) {
        if (err) return cb(err)
        if (!q.all$) elements = elements.slice(0, 1)
        if (0 === elements.length) return cb(null, null)

        var redisArgs = _.map(elements, 'id')
        redisArgs.unshift(table)

        dbConn.hdel(redisArgs, function(err) {
          if (!error(args, err, cb)) {
            cb(null, q.load$ && !q.all$ ? elements[0] : null)
          }
        })
      })
    },

    /**
     * return the underlying native connection object
     */
    native: function(args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.ent)

      cb(null, dbConn)
    }
  }

  /**
   * initialization
   */
  // seneca-entity 1.x decorated seneca.store; current versions export
  // the store initializer as entity/init.
  var storeInit = seneca.store
    ? seneca.store.init
    : seneca.export('entity/init')
  var meta = storeInit(seneca, opts, store)
  desc = meta.desc
  seneca.add({ init: store.name, tag: meta.tag }, function(args, done) {
    configure(opts, function(err) {
      if (err) {
        return seneca.fail(
          {
            code: 'entity/configure',
            store: store.name,
            error: err,
            desc: desc
          },
          done
        )
      } else done()
    })
  })
  return { name: store.name, tag: meta.tag }
}

/* ----------------------------------------------------------------------------
 * supporting boilerplate */

function isField(key) {
  return '$' !== key[key.length - 1]
}

var tablename = function(entity) {
  var canon = entity.canon$({ object: true })
  return (
    (canon.zone ? canon.zone + '_' : '') +
    (canon.base ? canon.base + '_' : '') +
    canon.name
  )
}
