# Messages

Applications use the entity API of `seneca-entity` (`make$`, `save$` and
so on). `seneca-entity` turns each call into a `sys:entity,cmd:<cmd>`
message, and this plugin answers it. Entity names map to Redis hash
names `zone_base_name` (missing parts are left out, so `-/-/foo` is the
hash `foo` and `zen/moon/bar` is `zen_moon_bar`).

## Plugin definition

`seneca.use('seneca-redis-store', options)` registers the store with
`seneca-entity` and returns `{ name: 'redis-store', tag }`. Load
`seneca-entity` first.

## init:redis-store

`init:redis-store,tag:<tag>` is the plugin's initialization action. It
creates the Redis client from the [options](options.md). Seneca calls
it while the plugin loads; you do not send it yourself.

## save

`entity.save$(callback)`.

* Without `id`, the id is `id$` if given, otherwise a new UUID.
* With an `id`, the stored entity is merged with the new data unless
  [`merge`](options.md#merge) is `false`.
* Writes `HSET <hash> <id> <json>`.
* Reply: a new entity object holding the stored data. Changing it does
  not change the entity you saved, and the other way round.

## load

`entity.load$(id or query, callback)`.

* With an `id`: `HGET <hash> <id>`. Reply: the entity, or `null`.
* Without an `id`: the first result of [list](#list) for the query, or
  `null`.

## list

`entity.list$(query, callback)`.

* Reads the whole hash with `HGETALL`, then filters in Node.js.
* A query field matches when the stored value is strictly equal
  (`===`). An array value matches any of its elements.
* An id string or an array of ids is a query on `id`.
* Query directives (keys ending in `$`, such as `sort$`, `limit$`,
  `fields$`) are not applied.
* Reply: an array of entities, in hash order.

## remove

`entity.remove$(id or query, callback)`.

* `{ all$: true }` with no other fields: `DEL <hash>`.
* Otherwise the plugin lists the matches and deletes the first one
  (`HDEL`), or all of them when `all$` is `true`.
* Reply: the deleted entity when `load$` is `true` and `all$` is not
  set, otherwise `null`.

## native

`entity.native$(callback)`. Reply: the `redis` client object, for
commands the entity API does not cover.

## close

`seneca-entity` adds the store's close to `sys:seneca,cmd:close`, so
`seneca.close()` sends `QUIT` to Redis and releases the client.
