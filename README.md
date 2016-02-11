# Seneca Redis Store

Redis storage driver for [Seneca].

Tested on: Node 0.12.7, Seneca 0.6.5, Redis 2.8.19

## Configuration

**String Uri**
```js
var opts = {
  'redis-store': 'redis://user:pass@host:port'
}

seneca.use('redis-store', opts);
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
```

See the fill list of available [Redis options].


[Seneca]: http://senecajs.org/
[Redis options]: https://github.com/NodeRedis/node_redis#rediscreateclient
