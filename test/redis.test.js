/*jslint node: true */
/*global describe:true, it:true*/

"use strict";

var seneca = require('seneca');
var async = require('async');
var shared = require('seneca-store-test');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var si = seneca();

si.use('..', { uri: 'redis://localhost:6379' });
si.__testcount = 0;
var testcount = 0;

var Code = require('code');
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;


describe('redis', function() {

    it ('basic', function(done) {
        testcount++;
        shared.basictest(si, done);
    });

    it('extra', function(done) {
        testcount++;
        extratest(si, done);
    });

    it('close', function(done) {
        shared.closetest(si, testcount, done);
    });
});


function extratest(si,done) {
    console.log('EXTRA');

    var fooent = si.make('foo',{a:1});
    fooent.save$(function(err,out){
        if(err) {
            return done(err);
        }
        console.log(out);
        done();
    });
    si.__testcount++;
}
