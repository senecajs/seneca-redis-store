'use strict'

var Assert = require('assert')
var _ = require('lodash')
var Redis = require('redis')
var Uuid = require('uuid')
var NOSJ = require('nosj')

var NAME = 'redis-store'
var MIN_WAIT = 16
var MAX_WAIT = 65336

module.exports = function (opts) {
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
  function error (args, err, cb) {
    if (err) {
      seneca.log.debug('error: ' + err)
      seneca.fail({code: 'entity/error', store: NAME}, cb)

      if ('ECONNREFUSED' === err.code || 'notConnected' === err.message || 'Error: no open connections' === err) {
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
  function reconnect (args) {
    configure(connectSpec, function (err, me) {
      if (err) {
        seneca.log(null, 'db reconnect (wait ' + waitmillis + 'ms) failed: ' + err)
        waitmillis = Math.min(2 * waitmillis, MAX_WAIT)
        setTimeout(
          function () {
            reconnect(args)
          }, waitmillis)
      }
      else {
        waitmillis = MIN_WAIT
        seneca.log(null, 'reconnect ok')
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
  function configure (spec, cb) {
    Assert(spec)
    Assert(cb)

    var conf = spec
    connectSpec = spec

    if (_.isString(conf)) {
      dbConn = Redis.createClient(conf)
      seneca.log({tag$: 'init'}, 'db ' + conf + ' opened.')
    }
    else if (_.has(spec, 'uri')) {
      dbConn = Redis.createClient(conf.uri, conf.options)
      seneca.log({tag$: 'init'}, 'db ' + conf.uri + ' opened.')
    }
    else {
      dbConn = Redis.createClient()
      seneca.log({tag$: 'init'}, 'db localhost opened.')
    }

    dbConn.on('error', function (err) {
      seneca.fail({code: 'seneca-redis/configure', message: err.message})
    })

    if (_.has(conf, 'db')) {
      dbConn.select(conf.db, function (err) {
        if (err) return cb(err)
        seneca.log({tag$: 'selected db'}, 'selected db ' + conf.db)
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
    close: function (cmd, cb) {
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
    save: function (args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.ent)

      var ent = args.ent
      var table = tablename(ent)
      var entp = {}

      if (!ent.id) {
        if (ent.id$) {
          ent.id = ent.id$
        }
        else {
          ent.id = Uuid()
        }
      }

      entp = NOSJ.stringify(ent.data$(false))

      // var objectMap = determineObjectMap(ent)
      dbConn.hset(table, ent.id, entp, function (err, result) {
        if (!error(args, err, cb)) {
          seneca.log(args.tag$, 'save', result)
          cb(null, ent)
        }
      })
    },

    /**
     * load first matching item based on id
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     */
    load: function (args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)

      var qent = args.qent
      var q = _.clone(args.q)
      var table = tablename(qent)

      q.limit$ = 1

      if (!q.id) {
        store.list(args, function (err, list) {
          if (!error(args, err, cb)) {
            var ent = list[0] || null
            seneca.log(args.tag$, 'load', ent)
            cb(err, ent)
          }
        })
      }
      else {
        dbConn.hget(table, q.id, function (err, row) {
          if (!error(args, err, cb)) {
            if (!row) {
              cb(null, null)
            }
            else {
              var ent = qent.make$(NOSJ.parse(row))
              seneca.log(args.tag$, 'load', ent)
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
    list: function (args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)

      var qent = args.qent
      var q = args.q
      var table = tablename(qent)

      dbConn.hgetall(table, function (err, results) {
        if (!error(args, err, cb)) {
          var list = []
          _.each(results, function (value, key) {
            var ent = qent.make$(NOSJ.parse(value))
            list.push(ent)
          })

          if (!_.isEmpty(q)) {
            list = _.filter(list, function (elem, b, c) {
              var match = true
              _.each(q, function (value, key) {
                var computed = (elem[key] === value)
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
    remove: function (args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.qent)
      Assert(args.q)
      var qent = args.qent
      var q = args.q
      var table = tablename(qent)

      if (q.id) {
        dbConn.hdel(table, q.id, function (err, result) {
          if (!error(args, err, cb)) {
            cb(null, [result])
          }
        })
      }
      else if (q.all$) {
        dbConn.del(table, function (err, result) {
          if (!error(args, err, cb)) {
            cb(null, [result])
          }
        })
      }
      else if (!_.isEmpty(q)) {
        store.list(args, function (err, elements) {
          if (err) return cb(err)
          var redisArgs = _.map(elements, 'id')
          redisArgs.unshift(table)

          dbConn.hdel(redisArgs, function (err, result) {
            if (!error(args, err, cb)) {
              cb(null, [result])
            }
          })
        })
      }
      else {
        cb(null, null)
      }
    },


    /**
     * return the underlying native connection object
     */
    native: function (args, cb) {
      Assert(args)
      Assert(cb)
      Assert(args.ent)

      cb(null, dbConn)
    }
  }


  /**
   * initialization
   */
  var meta = seneca.store.init(seneca, opts, store)
  desc = meta.desc
  seneca.add({init: store.name, tag: meta.tag}, function (args, done) {
    configure(opts, function (err) {
      if (err) {
        return seneca.fail({code: 'entity/configure', store: store.name, error: err, desc: desc}, done)
      }
      else done()
    })
  })
  return {name: store.name, tag: meta.tag}
}


/* ----------------------------------------------------------------------------
 * supporting boilerplate */

var tablename = function (entity) {
  var canon = entity.canon$({object: true})
  return (canon.zone ? canon.zone + '_' : '') + (canon.base ? canon.base + '_' : '') + canon.name
}
