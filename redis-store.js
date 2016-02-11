/*jslint node: true */
/*
/* Copyright (c) 2012 Marius Ursache
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var assert = require("assert");
var _ = require('underscore');
var redis = require('redis');
var uuid = require('node-uuid');

var NAME = "redis-store";
var MIN_WAIT = 16;
var MAX_WAIT = 65336;
var OBJECT_TYPE_STATIC = 's';
var OBJECT_TYPE_OBJECT = 'o';
var OBJECT_TYPE_DATE = 'd';

var globalObjectMap = {};

module.exports = function(opts) {
  var seneca = this;
  var desc;
  var minwait;
  var dbConn = null;
  var connectSpec = null;
  var waitmillis = MAX_WAIT;

  opts.minwait = opts.minwait || MIN_WAIT;
  opts.maxwait = opts.maxwait || MAX_WAIT;



  /**
   * check and report error conditions seneca.fail will execute the callback
   * in the case of an error. Optionally attempt reconnect to the store depending
   * on error condition
   */
  function error(args, err, cb) {
    if( err ) {
      seneca.log.debug('error: '+err);
      seneca.fail({code:'entity/error',store: NAME},cb);

      if( 'ECONNREFUSED' === err.code || 'notConnected' === err.message || 'Error: no open connections' === err ) {
        minwait = opts.minwait;
        if (minwait) {
          //collmap = {};
          reconnect(args);
        }
      }
      return true;
    }
    return false;
  }



  /**
   * attemp to reconnect to the store
   */
  //TODO: this is a function of the fw / subsystem NOT the store driver
  //      drivers should be dumb!
  function reconnect(args) {
    configure(connectSpec, function(err, me) {
      if (err) {
        seneca.log(null, 'db reconnect (wait ' + waitmillis + 'ms) failed: ' + err);
        waitmillis = Math.min(2 * waitmillis, MAX_WAIT);
        setTimeout(
          function(){
            reconnect(args);
          }, waitmillis);
      }
      else {
        waitmillis = MIN_WAIT;
        seneca.log(null, 'reconnect ok');
      }
    });
  }



  /**
   * configure the store - create a new store specific connection object
   *
   * params:
   * spec - store specific configuration
   * cb - callback
   */
  function configure(spec, cb) {
    assert(spec);
    assert(cb);

    var conf = spec;
    connectSpec = spec;

    if (_.isString(conf)) {
      dbConn = redis.createClient(conf);
      seneca.log({tag$:'init'}, 'db '+conf+' opened.');
    } else if (_.has(spec, 'uri')) {
      dbConn = redis.createClient(conf.uri, conf.options);
      seneca.log({tag$:'init'}, 'db '+conf.uri+' opened.');
    } else {
      dbConn = redis.createClient();
      seneca.log({tag$:'init'}, 'db localhost opened.');
    }

    dbConn.on('error', function(err){
      seneca.fail({code: "seneca-redis/configure", message: err.message});
    });

    if(_.has(conf, 'db')){
      dbConn.select(conf.db, function(err){
        seneca.log({tag$:'selected db'}, 'selected db ' + conf.db);
      });
    }

    seneca.log.debug('init', 'db open', spec);
    cb(null);
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
      assert(cb);
      if (dbConn) {
        // close the connection
        dbConn.quit();
        dbConn = null;
      }
      cb(null);
    },



    /**
     * save the data as specified in the entitiy block on the arguments object
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     */
    save: function(args, cb) {
      assert(args);
      assert(cb);
      assert(args.ent);

      var ent = args.ent;
      var q = args.q;
      var table = tablename(ent);
      var entp = {};

      if (!ent.id) {
        if( ent.id$ ) {
          ent.id = ent.id$;
        }
        else {
          ent.id = uuid();
        }
      }

      entp = makeentp(ent);

      var objectMap = determineObjectMap(ent);
      dbConn.hset(table, ent.id, entp, function(err, result) {
        if (!error(args, err, cb)) {
          saveMap(dbConn, objectMap, function(err, result) {
            if (!error(args, err, cb)) {
              seneca.log(args.tag$,'save', result);
              cb(null, ent);
            }
          });
        }
      });
    },



    /**
     * load first matching item based on id
     * params
     * args - of the form { ent: { id: , ..entitiy data..} }
     * cb - callback
     */
    load: function(args, cb) {
      assert(args);
      assert(cb);
      assert(args.qent);
      assert(args.q);

      var qent = args.qent;
      var q = _.clone(args.q);
      var table = tablename(qent);

      q.limit$ = 1;

      if (!q.id) {
        store.list(args, function(err, list) {
          if (!error(args, err, cb)) {
            var ent = list[0] || null;
            seneca.log(args.tag$, 'load', ent);
            cb(err, ent ? ent : null );
          }
        });
      }
      else {
        loadMap(dbConn, table, function(err, objMap) {
          if (!error(args, err, cb)) {
            dbConn.hget(table, q.id, function(err, row) {
              if (!error(args, err, cb)) {
                if (!row) {
                  cb(null, null);
                }
                else {
                  var ent = makeent(qent, row, objMap);
                  seneca.log(args.tag$, 'load', ent);
                  cb(null, ent);
                }
              }
            });
          }
        });
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
      assert(args);
      assert(cb);
      assert(args.qent);
      assert(args.q);

      var qent = args.qent;
      var q = args.q;
      var table = tablename(qent);

      loadMap(dbConn, table, function(err, objMap) {
        if (!error(args, err, cb)) {
          dbConn.hgetall(table, function(err, results) {
            if (!error(args, err, cb)) {
              var list = [];
              _.each(results, function(value, key) {
                var ent = makeent(qent, value, objMap);
                list.push(ent);
              });

              if (!_.isEmpty(q)) {
                list = _.filter(list, function(elem, b, c) {
                  var match = true;
                  _.each(q, function(value, key) {
                    var computed = (elem[key] === value);
                    match = match && computed;
                  });
                  return match;
                });
              }
              cb(null, list);
            }
          });
        }
      });
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
      assert(args);
      assert(cb);
      assert(args.qent);
      assert(args.q);
      var qent = args.qent;
      var q = args.q;
      var table = tablename(qent);

      if (q.all$) {
        dbConn.del(table, function(err, result) {
          if (!error(args, err, cb)) {
            cb(null, [result]);
          }
        });
      }
      else if(!_.isEmpty(q)) {

        store.list(args, function(err, elements) {
          var redisArgs = _.pluck(elements, 'id');
          redisArgs.unshift(table);

          dbConn.hdel(redisArgs, function(err, result) {
            if (!error(args, err, cb)) {
              cb(null, [result]);
            }
          });
        });
      }
      else {
        cb(null, null);
      }
    },



    /**
     * return the underlying native connection object
     */
    native: function(args, cb) {
      assert(args);
      assert(cb);
      assert(args.ent);

      var ent = args.ent;
      cb(null, dbConn);
    }
  };



  /**
   * initialization
   */
  var meta = seneca.store.init(seneca, opts, store);
  desc = meta.desc;
  seneca.add({init:store.name,tag:meta.tag}, function(args,done) {
    configure(opts, function(err) {
      if (err) {
        return seneca.fail({code:'entity/configure', store:store.name, error:err, desc:desc}, done);
      }
      else done();
    });
  });
  return { name:store.name, tag:meta.tag };
};



/* ----------------------------------------------------------------------------
 * supporting boilerplate */

var tablename = function (entity) {
  var canon = entity.canon$({object:true});
  return (canon.base?canon.base+'_':'')+canon.name;
};



var makeentp = function(ent) {
  var entp = {};
  var fields = ent.fields$();

  fields.forEach(function(field){
    if(_.isDate(ent[field]) || _.isObject(ent[field])) {
      entp[field] = JSON.stringify(ent[field]);
    }
    else {
      entp[field] = ent[field];
    }
  });
  return JSON.stringify(entp);
};



var makeent = function(ent, row, objMap) {
  var entp;
  var fields;

  row = JSON.parse(row);
  fields = _.keys(row);

  if (!_.isUndefined(ent) && !_.isUndefined(row)) {
    entp = {};
    fields.forEach(function(field) {
      if (!_.isUndefined(row[field]) && !_.isUndefined(objMap.map[field])) {
        if (objMap.map[field] === OBJECT_TYPE_STATIC) {
          entp[field] = row[field];
        }
        else if (objMap.map[field] === OBJECT_TYPE_OBJECT) {
          entp[field] = JSON.parse(row[field]);
        }
        else if (objMap.map[field] === OBJECT_TYPE_DATE) {
          entp[field] = new Date(JSON.parse(row[field]));
        }
      }
    });
  }
  return ent.make$(entp);
};



var determineObjectMap = function(ent){
  var fields = ent.fields$();
  var objectName = tablename(ent);

  var objectMap = {};
  var map = {};

  fields.forEach(function(field){
    if (_.isDate(ent[field])) {
      map[field] = OBJECT_TYPE_DATE;
    }
    else if (_.isObject(ent[field])) {
      map[field] = OBJECT_TYPE_OBJECT;
    }
    else {
      map[field] = OBJECT_TYPE_STATIC;
    }
  });

  objectMap = {id:objectName, map:map};

  if(!_.isUndefined(globalObjectMap[objectName])  && _.size(objectMap.map) < _.size(globalObjectMap[objectName].map)) {
    objectMap = globalObjectMap[objectName];
  }
  else {
    globalObjectMap[objectName] = objectMap;
  }

  return objectMap;
};



var loadMap = function(dbConn, key, cb){
  var table  = 'seneca_object_map';

  dbConn.hget(table, key, function(err, result){
    if (!err) {
      var objectMap = JSON.parse(result);
      cb(null, objectMap);
    }
    else {
      cb(err, null);
    }
  });
};



var saveMap = function(dbConn, newObjectMap, cb) {

  var table  = 'seneca_object_map';
  var key = newObjectMap.id;

  loadMap(dbConn, key, function(err, existingObjMap) {
    if(err) { return cb(err, undefined); }

    var mergedObjectMap = newObjectMap;

    if(existingObjMap && existingObjMap.map) {
      mergedObjectMap = existingObjMap;
      for(var attr in newObjectMap.map) {
        if(newObjectMap.map.hasOwnProperty(attr)) {
          mergedObjectMap.map[attr] = newObjectMap.map[attr];
        }
      }
    }

    var savedObject = JSON.stringify(mergedObjectMap);
    dbConn.hset(table, key, savedObject, cb);

  });
};
