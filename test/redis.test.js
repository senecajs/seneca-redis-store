/* Copyright (c) 2012 Marius Ursache */

var seneca = require('seneca');
var shared = require('seneca/test/store/shared');

var config = {
  log:'print'
};

var si = seneca(config);

var senecaRedisStore = require('seneca-redis');
var senecaRedisStoreOpts = {
    host:'localhost',
    port:6379,
    auth:'secret'};

si.use(senecaRedisStore, senecaRedisStoreOpts, useCallback);

function useCallback(a,b,c){
  require('eyes').inspect([a,b,c], "a,b,c:");

}

//require('eyes').inspect(senecaRedisStore, "senecaRedisStore:");

si.__testcount = 0;
var testcount = 0;

module.exports = {
  basictest: (testcount++, shared.basictest(si)),
  extratest: (testcount++, extratest(si)),
  closetest: shared.closetest(si,testcount)
};

function extratest(si) {
  console.log('EXTRA')
  si.__testcount++
}