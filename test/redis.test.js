/*jslint node: true */
/*global describe:true, it:true*/
/* Copyright (c) 2012 Marius Ursache */

"use strict";


var seneca = require('seneca');
var async = require('async');
var shared = require('seneca-store-test')


var si = seneca();

si.use('..', { host:'localhost', port:6379});
si.__testcount = 0;
var testcount = 0;

describe('redis', function(){
  it('basic', function(done){
    this.timeout(0);
    testcount++;
    shared.basictest(si, done);
  });

  it('extra', function(done){
    testcount++
    extratest(si,done)
  })

  it('close', function(done){
    this.timeout(0);
    shared.closetest(si, testcount, done);
  });
});


function extratest(si,done) {
  console.log('EXTRA');

  var fooent = si.make('foo',{a:1})
  fooent.save$(function(err,out){
    if(err) return done(err);

    console.log(out)
    done()
  })

  si.__testcount++;
}
