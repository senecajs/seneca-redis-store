/*jslint node: true */
/*global describe:true, it:true*/
/* Copyright (c) 2012 Marius Ursache */

"use strict";

//var assert = require('assert');
var seneca = require('seneca');
var async = require('async');
var senecaRedisStore = require('..');
var shared = seneca.test.store.shared;

//var si = seneca({ log:'print' });
var si = seneca();

si.use(senecaRedisStore, { host:'localhost', port:6379});
si.__testcount = 0;
var testcount = 0;

describe('redis', function(){
  it('basic', function(done){
    this.timeout(0);
    testcount++;
    shared.basictest(si, done);
  });

  it('close', function(done){
    this.timeout(0);
    shared.closetest(si, testcount, done);
  });
});


function extratest(si) {
  console.log('EXTRA');
  si.__testcount++;
}


