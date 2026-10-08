# How the store works

## Data layout

Each entity type is one Redis hash, named `zone_base_name` from the
entity canon. Each entity is one field of that hash: the field name is
the entity id and the value is the entity data as JSON (serialized with
`nosj`). Nothing else is stored, so the
data is easy to inspect with `redis-cli HGETALL <hash>`.

## Queries

Redis has no query language for hash values, so `list$`, `load$` by
query and `remove$` by query read the whole hash and filter it in
Node.js. This is simple and correct, but the cost grows with the number
of entities of that type. Lookups by id (`load$(id)`) use a single
`HGET`. Sorting, limits and field selection are not supported.

## Lifecycle

1. `seneca.use()` registers the store with `seneca-entity` and adds
   `init:redis-store`.
2. Seneca runs `init:redis-store` before `ready`. It creates one Redis
   client for the plugin instance and selects `db` when given.
3. Entity operations use that client.
4. `seneca.close()` runs the store's close through
   `sys:seneca,cmd:close`, which sends `QUIT`.

## Seneca 3 and Seneca 4

The plugin code is the same for both. The differences that matter:

* Seneca 4 needs a current `seneca-entity`, which exports `entity/init`
  instead of decorating `seneca.store`. The plugin uses whichever is
  present.
* Seneca 4 reads plugin options only from `use()` and
  `options.plugin['redis-store']`.
* Seneca 4 does not wrap action errors, so callbacks receive the
  original error.

## Limits

* One client per plugin instance; no clustering or sentinel support
  beyond what the `redis` client options provide.
* The plugin uses version 2 of the `redis` package, which is callback
  based and no longer maintained.
* A client `error` event is thrown (see
  [Errors](../reference/errors.md#seneca-redisconfigure)).
