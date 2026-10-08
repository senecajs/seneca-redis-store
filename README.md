![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] data storage plugin

# @seneca/redis-store

A Seneca entity store that keeps entities in [Redis][redis-url]. Each
entity type is a Redis hash; each entity is one field of that hash,
holding the entity data as JSON. It works with Seneca 3 and with the
Seneca 4 prerelease (`seneca@4.0.0-rc5`), together with `seneca-entity`.

[![npm version][npm-badge]][npm-url]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca seneca-entity seneca-redis-store
```

The package is published on npm as `seneca-redis-store`. You need a
running Redis server.

## Quick Example

```js
const Seneca = require('seneca')

const seneca = Seneca()
  .use('seneca-entity')
  .use('seneca-redis-store', { uri: 'redis://127.0.0.1:6379' })

seneca.ready(function () {
  const apple = seneca.make$('fruit')
  apple.name = 'Pink Lady'
  apple.price = 0.99
  apple.save$(function (err, apple) {
    console.log('apple.id = ' + apple.id)
    seneca.close()
  })
})
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a complete
  program that saves, loads, lists and removes entities.
* [Configure the connection](docs/how-to/configure-the-connection.md):
  URI, client options, database number.
* [Run the tests locally](docs/how-to/run-the-tests-locally.md): Docker
  Redis and the test environment variables.
* [Migrate from Seneca 3](docs/how-to/migrate-from-seneca-3.md).

The full index is in [docs/README.md](docs/README.md).

## Motivation

Redis is a fast, widely deployed key value server. This plugin lets a
Seneca application use it through the standard entity API, so business
logic does not depend on the storage engine. See
[How the store works](docs/explanation/how-the-store-works.md).

## Support

* Open an issue on [GitHub][github issue].
* Seneca documentation: [senecajs.org][].
* This module is sponsored and supported by [Voxgig](https://www.voxgig.com).

## API

You do not call this plugin directly. It answers the entity messages
that `seneca-entity` sends.

| Topic | Reference |
| ----- | --------- |
| Plugin options (`uri`, `options`, `db`, `minwait`, `maxwait`, `merge`) | [Options](docs/reference/options.md) |
| Entity operations (`save$`, `load$`, `list$`, `remove$`, `native$`, close) | [Messages](docs/reference/messages.md) |
| Error codes | [Errors](docs/reference/errors.md) |

## Contributing

The [Senecajs org][] encourages open participation. To run the tests
you need Docker and Node.js 24 or 22:

```sh
npm install
npm run services:up   # Redis on host port 16380
npm test
npm run services:down
```

The tests use the Seneca 4 prerelease from `devDependencies`. Details,
including the environment variables, are in
[Run the tests locally](docs/how-to/run-the-tests-locally.md). The CI
workflow is delivered as a patch in `.patches/` (see its README).

## Background

This plugin started in 2013 and uses the
[redis](https://github.com/redis/node-redis) driver (version 2).

| Plugin | Seneca | Node.js | Redis |
| ------ | ------ | ------- | ----- |
| 1.2.x | 3.x, 4.0.0-rc5 and later | 24, 22 (18 and later) | tested with 8.10 |
| 1.1.x | 1.x to 3.x | 4, 6 | |

Released under the [MIT][] license.

[npm-badge]: https://img.shields.io/npm/v/seneca-redis-store.svg
[npm-url]: https://npmjs.com/package/seneca-redis-store
[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[senecajs.org]: http://senecajs.org/
[redis-url]: http://redis.io/
[github issue]: https://github.com/senecajs/seneca-redis-store/issues
