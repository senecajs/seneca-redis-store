/* Copyright (c) 2012 Marius Ursache */

var common  = require('seneca/lib/common');
var Store   = require('seneca').Store;
var redis   = require('redis');

var eyes    = common.eyes; // Used for development only
var _       = common._;
var uuid    = common.uuid;

var MIN_WAIT = 16;
var MAX_WAIT = 65336;

function RedisStore() {
  var self   = new Store();
  var parent = self.parent();

  var inid   = common.idgen(12);
  var seneca;
  var connection;

  globalObjectMap = {};

  self.name  = 'redis-store';

  /** create or update an entity */

  self.save$ = function(args, cb){
    // entity to save
    var ent  = args.ent;
    var q    = args.q;
    var table  = tablename(ent);

    var entp = {};

    if( !ent.id ) {
      ent.id = uuid();
    }

    entp = makeentp(ent);

    var objectMap = determineObjectMap(ent);
    self.connection.hset(table, ent.id, entp, function(err, result){
      if (err) {
        return seneca.fail({code:'save', tag:args.tag$,
            store:self.name, query:query, fields:fields, error:err}, cb);
        } else {
          self.saveMap(objectMap);
          seneca.log(args.tag$,'save', result);
          cb(null, ent);
        }
    });
  };

  /** load the first matching entity */
  self.load$ = function(args, cb){
    var q    = _.clone(args.q);
    var qent = args.qent;
    var table = tablename(qent);

    q.limit$ = 1;

    self.loadMap(table, function(err, objMap){
      self.connection.hget(table, qent.id, function(err, row){
        if (err) {
          seneca.fail({code:'load',tag:args.tag$,store:self.name,query:query,error:err}, cb);
        } else{
          var ent = makeent(qent, row, objMap);
          seneca.log(args.tag$, 'load', ent);
          cb(null, ent);
        }
      });
    });
  };

  /** load all matching entities */
  self.list$ = function(args, cb){
    var qent  = args.qent;
    var q     = args.q;
    var table = tablename(qent);

    self.loadMap(table, function(err, objMap){
      self.connection.hgetall(table, function(err, results){
        if (err) {
          seneca.fail( {code:'list',tag:args.tag$,store:self.name,query:query,error:err},cb );
        } else{
          var list = [];
          _.each(results, function(value, key){
              var ent = makeent(qent, value, objMap);
              list.push(ent);
          });

          if(!_.isEmpty(q)){
            list = _.filter(list, function(elem, b, c){
              var match = true;
              _.each(q, function(value, key){
                var computed = (elem[key] === value);
                match = match && computed;
              });
              return match;
            });
          }
          cb(null, list);
        }
      });
    });
  };

  /** remove all matching entities */
  self.remove$ = function(args, cb){
    var qent = args.qent;
    var q    = args.q;
    var table = tablename(qent);

    if(q.all$){
      self.connection.hkeys(table, function(err, keys){
        if(err){
          seneca.fail({code:'remove',tag:args.tag$,store:self.name,query:q,error:err}, cb);
        } else {
          self.connection.hdel(table, keys, function(err, result){
            if (err) {
               seneca.fail({code:'remove',tag:args.tag$,store:self.name,query:q,error:err}, cb);
            } else {
              cb(null, result);
            }
          });
        }
      });
    } else if(!_.isEmpty(q)){
      self.list$(args, function(err, elements){
        var elementIds = _.pluck(elements, 'id');

        self.connection.hdel(table, elementIds, function(err, result){
          if (err) {
             seneca.fail({code:'remove',tag:args.tag$,store:self.name,query:q,error:err}, cb);
          } else {
            cb(null, result);
          }
        });
      });
    }
  };


  /** close connection to data store - called during shutdown */
  self.close$ = function(args, cb){
    if(self.connection) {
      self.connection.quit();
      //self.connection.end();
    }
    else cb();
  };


self.saveMap = function(objectMap){
  var table  = 'seneca_object_map';
  var key = objectMap.id;
  var savedObject = JSON.stringify(objectMap);

  self.connection.hset(table, key, savedObject, function(err, result){
    if (err) {
      return seneca.fail({code:'saveMap/objectMap', tag:args.tag$,
          store:self.name, objectMap:objectMap, error:err}, cb);
    } else {
      seneca.log(savedObject,'saveMap/objectMap', result);
    }
  });
};

self.loadMap = function(key, cb){
  var table  = 'seneca_object_map';

  self.connection.hget(table, key, function(err, result){
    if (err) {
      return seneca.fail({code:'loadMap/objectMap', tag:args.tag$,
          store:self.name, table:table, error:err}, cb);
    } else {
      var objectMap = JSON.parse(result);
      seneca.log(objectMap,'loadMap/objectMap', objectMap);
      cb(null, objectMap);
    }
  });
};

var savestm = function(ent) {
  var stm = {};

  var table  = tablename(ent);
  var fields = ent.fields$();
  var entp   = makeentp(ent);

  var values = {};
  var params = [];

  fields.forEach(function(field) {
    var fieldPlaceholder = '$'+field;
    values[fieldPlaceholder] = entp[field];
    params.push(fieldPlaceholder);
  });

  stm.text   = 'INSERT INTO ' + table + ' (' + fields + ') values (' + params + ')';
  stm.values = values;

  return stm;
};

var updatestm = function(ent) {
  var stm = {};

  var table  = tablename(ent);
  var fields = ent.fields$();
  var entp   = makeentp(ent);

  var values = {};
  var params = [];

  fields.forEach( function(field) {
    if( !(_.isUndefined(ent[field]) || _.isNull(ent[field])) ) {
      var fieldPlaceholder = '$'+field;
      values[fieldPlaceholder] = entp[field];
      params.push(field + ' = ' + fieldPlaceholder);
    }
  });

  values['$id'] = ent.id;

  stm.text   = "UPDATE " + table + " SET " + params + " WHERE id = $id";
  stm.values = values;

  return stm;
};

var deletestm = function(qent,q) {
  var stm = {};
  var table = tablename(qent);
  var params = [];
  var values = {};

  var w = whereargs(makeentp(qent),q);
  var wherestr = '';

  if( !_.isEmpty(w) ) {
    for(var param in w) {
      //params.push(param + ' = ' + self.connection.escape(w[param]));
      var fieldPlaceholder = '$' + param;
      params.push(param + ' = ' + fieldPlaceholder);
      values[fieldPlaceholder] = w[param];
    }

    wherestr = " WHERE " + params.join(' AND ');
  }

  var limistr = '';
  if( !q.all$ ) {
    // Sqlite does not have support for LIMIT in DELETE
    // (unless is explicitly compiled)
    limistr = '';
  }

  stm.text = "DELETE FROM " + table + wherestr + limistr;
  stm.values = values;

  return stm;
};

var selectstm = function(qent,q) {
  var stm = {};
  var table = tablename(qent);
  var params = [];
  var values = {};

  var w = whereargs(makeentp(qent),q);
  var wherestr = '';

  if( !_.isEmpty(w) ) {
    for(var param in w) {
      var fieldPlaceholder = '$' + param;
      params.push(param + ' = ' + fieldPlaceholder);
      values[fieldPlaceholder] = w[param];
    }

    wherestr = " WHERE " + params.join(' AND ');
  }

  var mq = metaquery(qent, q);
  var metastr = ' ' + mq.join(' ');

  stm.text = "SELECT * FROM " + table + wherestr + metastr;
  stm.values = values;

  return stm;
};


var metaquery = function(qent,q) {
  var mq = [];

  if( q.sort$ ) {
    for( var sf in q.sort$ ) break;
    var sd = q.sort$[sf] < 0 ? 'ASC' : 'DESC';
    mq.push('ORDER BY '+sf+' '+sd);
  }

  if( q.limit$ ) {
    mq.push('LIMIT '+q.limit$);
  }

  return mq;
};

var whereargs = function(qent, q) {
  var w = {};

  var qok = fixquery(qent,q);

  for(var p in qok) {
    w[p] = qok[p];
  }

  return w;
};


var fixquery = function(qent, q) {
  var qq = {};
  for( var qp in q ) {
    if( !qp.match(/\$$/) ) {
      qq[qp] = q[qp];
    }
  }
  return qq;
};

  self.configure = function(spec, cb) {
    self.spec = spec;

    var conf = 'string' == typeof(spec) ? null : spec;

    if(!conf) {
      conf = {};

      //redis://pass@host:port
      var urlM = /^redis:\/\/((.*?)@)?(.*?)(:?(\d+))$/.exec(spec);
      conf.host = urlM[3];
      conf.password = urlM[2];
      conf.port = urlM[5];
      conf.port = conf.port ? parseInt(conf.port,10) : null;
    }

    self.connection = redis.createClient(conf.port, conf.host);
    //self.connection.debug_mode = 1;

    self.connection.on('error', function(err){
      seneca.fail({code:"seneca-redis/configure", message:err.message});
      cb();
    });

    if(_.has(conf, 'auth') && !_.isEmpty(conf.auth)){
      self.connection.auth(conf.auth, function(err, message){
        seneca.log({tag$:'init'}, 'authed to ' + conf.host);
      });
    }

    seneca.log({tag$:'init'}, 'db '+conf.host+' opened.');
    cb(null, self);
  };

  function reconnect(){
    self.configure(self.spec, function(err, me){
      if( err ) {
        seneca.log(null, 'db reconnect (wait ' + self.waitmillis + 'ms) failed: ' + err);
        self.waitmillis = Math.min(2 * self.waitmillis, MAX_WAIT);
        setTimeout(
          function(){
            reconnect();
          }, self.waitmillis);
      } else {
        self.waitmillis = MIN_WAIT;
        seneca.log(null, 'reconnect ok');
      }
    });
  }

  function error(args, err, cb) {
    if(err) {
      if (!err.fatal) {
        return false;
      }

      seneca.log(args.tag$, 'error: ' + err);
      seneca.fail({code:'entity/error', store:self.name}, cb);
      return true;
    }

    return false;
  }

  /** called by seneca to initialise plugin */
  self.init = function(si, opts, cb) {
    parent.init(si, opts, function(){

      // keep a reference to the seneca instance
      seneca = si;

      self.configure(opts, function(err) {
        if(err) {
          return seneca.fail({code:'entity', store:self.name, error:err}, cb);
        }
        else cb();
      });
    });
  };

  return self;
}

var makeentp = function(ent) {
    var entp = {};
    var fields = ent.fields$();

    fields.forEach(function(field){
      if(_.isDate(ent[field])) {
        entp[field] = JSON.stringify(ent[field]);
      } else if(_.isObject(ent[field]) ) {
        entp[field] = JSON.stringify(ent[field]);
      } else {
        entp[field] = ent[field];
      }
    });

    return JSON.stringify(entp);
  };

var makeent = function(ent, row, objMap) {

  var objectTypeStatic = 's';
  var objectTypeObject = 'o';
  var objectTypeDate = 'd';

    var entp;

    row = JSON.parse(row);
    //var fields = ent.fields$();
    var fields = _.keys(row);

    if( !_.isUndefined(ent) && !_.isUndefined(row) ) {
      entp = {};
      fields.forEach(function(field){
        if( !_.isUndefined(row[field]) && !_.isUndefined(objMap.map[field])) {
          if(objMap.map[field]===objectTypeStatic){
            entp[field] = row[field];
          } else if(objMap.map[field]===objectTypeObject){
            entp[field] = JSON.parse(row[field]);
          } else if(objMap.map[field]===objectTypeDate){
            entp[field] = new Date(JSON.parse(row[field]));
          }
        }
      });
    }

    return ent.make$(entp);
};

var tablename = function (entity) {
  var canon = entity.canon$({object:true});
  return (canon.base?canon.base+'_':'')+canon.name;
};

var determineObjectMap = function(ent){
  var objectTypeStatic = 's';
  var objectTypeObject = 'o';
  var objectTypeDate = 'd';

  var fields = ent.fields$();
  var objectName = tablename(ent);

  var objectMap = {};
  var map = {};

  fields.forEach(function(field){
    if(_.isDate(ent[field])) {
      map[field] = objectTypeDate;
    } else if(_.isObject(ent[field]) ) {
      map[field] = objectTypeObject;
    } else {
      map[field] = objectTypeStatic;
    }
  });

  objectMap = {id:objectName, map:map};

  if(!_.isUndefined(globalObjectMap[objectName])  &&
    _.size(objectMap.map) < _.size(globalObjectMap[objectName].map)){
    return globalObjectMap[objectName];
  } else {
    globalObjectMap[objectName] = objectMap;
  }

  return objectMap;
};

module.exports = new RedisStore();
