# Getting started

In this tutorial you store fruit entities in Redis. You need Node.js 22
or 24 and Docker (or any Redis server).

## 1. Start Redis

From a clone of this repository:

```sh
npm install
npm run services:up
```

This starts `redis:8.10` with host port 16380 (see `docker-compose.yml`).

In your own project, install the packages instead:

```sh
npm install seneca seneca-entity seneca-redis-store
```

## 2. Write the program

Save this as [`docs/examples/getting-started.js`](../examples/getting-started.js)
(in your own project, replace `require('../../redis-store.js')` with
`'seneca-redis-store'`):

```js
// Save, load, list and remove entities in Redis.
// Start Redis first: npm run services:up (host port 16380).
const Seneca = require('seneca')

const host = process.env.SENECA_TEST_REDIS_HOST || '127.0.0.1'
const port = process.env.SENECA_TEST_REDIS_PORT || '16380'

const seneca = Seneca({ legacy: false })
  .quiet()
  .use('seneca-entity')
  .use(require('../../redis-store.js'), {
    uri: 'redis://' + host + ':' + port,
  })

seneca.ready(function () {
  const apple = seneca.make$('fruit')
  apple.id$ = 'apple'
  apple.name = 'Pink Lady'
  apple.price = 0.99

  apple.save$(function (err, saved) {
    if (err) throw err
    console.log('saved:', saved.id, saved.name, saved.price)

    seneca.make$('fruit').load$('apple', function (err, loaded) {
      if (err) throw err
      console.log('loaded:', loaded.name)

      seneca.make$('fruit').list$({ name: 'Pink Lady' }, function (err, list) {
        if (err) throw err
        console.log('listed:', list.length)

        seneca.make$('fruit').remove$('apple', function (err) {
          if (err) throw err
          console.log('removed: apple')
          seneca.close(function () {
            console.log('closed')
          })
        })
      })
    })
  })
})
```

## 3. Run it

```sh
node docs/examples/getting-started.js
```

Output with `seneca@4.0.0-rc5`:

```
saved: apple Pink Lady 0.99
loaded: Pink Lady
listed: 1
removed: apple
closed
```

## What happened

* `seneca-entity` adds `make$` and the entity operations. This plugin
  answers them.
* `save$` wrote the field `apple` of the Redis hash `fruit`, with the
  entity data as JSON. `id$` chose the id; without it the plugin
  generates a UUID.
* `load$('apple')` read that field back. `list$` read the whole hash and
  filtered it in Node.js.
* `seneca.close()` closed the Redis connection, so the process exits.

## Next steps

* [Configure the connection](../how-to/configure-the-connection.md).
* [Options](../reference/options.md) and [Messages](../reference/messages.md).
* [How the store works](../explanation/how-the-store-works.md).

Stop Redis with `npm run services:down`.
