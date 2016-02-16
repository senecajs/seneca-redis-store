![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] data storage plugin

# seneca-redis-store

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coverage-badge]][coverage-url]
[![Code Climate][codeclimate-badge]][codeclimate-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter][gitter-badge]][gitter-url]


A storage engine that uses [redis][redis-url] to persist data.

seneca-redis-store's source can be read in an annotated fashion by,

- running `npm run annotate`
- viewing [online](http://senecajs.github.io/seneca-redis-store/doc/redis-store.html).

The annotated source can be found locally at [./doc/redis-store.html]().

If you're using this module, and need help, you can:

- Post a [github issue][],
- Tweet to [@senecajs][],
- Ask on the [Gitter][gitter-url].

If you are new to Seneca in general, please take a look at [senecajs.org][]. We have everything from
tutorials to sample apps to help get you up and running quickly.


## Install
To install, simply use npm. Remember you will need to install [Seneca.js][] if you haven't already.

```
npm install seneca
npm install seneca-redis-store
```

You also need redis running locally. Please visit [redis][redis-url] for more info about how to install and run redis

## Test
To run tests, simply use npm:

```
npm run test
```

## Quick Example

**String Uri**
```js
var opts = {
  'redis-store': 'redis://user:pass@host:port'
}
```

**String Uri with Redis Options**
```js
var opts = {
  'redis-store': {
    uri: 'redis://user:pass@host:port',
    options: {...}
  }
}

seneca.use('redis-store', opts);

seneca.ready(function() {
  var apple = seneca.make$('fruit')
  apple.name = 'Pink Lady'
  apple.price = 0.99
  apple.save$(function (err, apple) {
    console.log("apple.id = " + apple.id)
  })
})
```

See the full list of available [Redis options].

## Usage
You don't use this module directly. It provides an underlying data storage engine for the Seneca entity API:

```js
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$(function (err, entity) { ... })
entity.load$({id: ... }, function (err, entity) { ... })
entity.list$({property: ... }, function (err, entity) { ... })
entity.remove$({id: ... }, function (err, entity) { ... })
```

## Contributing
The [Senecajs org][] encourage open participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in touch.

## License
Copyright Marius Ursache and other contributors 2016, Licensed under [MIT][].

[npm-badge]: https://img.shields.io/npm/v/seneca-redis-store.svg
[npm-url]: https://npmjs.com/package/seneca-redis-store
[travis-badge]: https://travis-ci.org/senecajs/seneca-redis-store.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-redis-store
[codeclimate-badge]: https://codeclimate.com/github/senecajs/seneca-redis-store/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/senecajs/seneca-redis-store
[coverage-badge]: https://coveralls.io/repos/senecajs/seneca-redis-store/badge.svg?branch=master&service=github
[coverage-url]: https://coveralls.io/github/senecajs/seneca-redis-store?branch=master
[david-badge]: https://david-dm.org/senecajs/seneca-redis-store.svg
[david-url]: https://david-dm.org/senecajs/seneca-redis-store

[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca

[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[senecajs.org]: http://senecajs.org/
[redis-url]: http://redis.io/
[Redis options]: https://github.com/NodeRedis/node_redis#rediscreateclient
[github issue]: https://github.com/senecajs/seneca-redis-store/issues
[@senecajs]: http://twitter.com/senecajs
