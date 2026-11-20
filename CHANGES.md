# Changes

## 2.0.0 2026-11-20

First version published as `@seneca/redis-store`. Versions up to 1.1.0
were published as `seneca-redis-store`. Version 1.2.0 was never
published; its changes are part of this release.

* Seneca 4: the peer dependencies are `seneca` `^4.0.0` and
  `@seneca/entity` `^29.0.0`. Seneca 3 is no longer supported; Seneca 3
  users stay on `seneca-redis-store@1`.
* Renamed from `seneca-redis-store` to `@seneca/redis-store`.
* Node.js 24 or later (`engines.node` `>=24`).
* The store registers through the `entity/init` export of
  `@seneca/entity`. Load `@seneca/entity` before this plugin, by its
  full name; without it the plugin fails to load with a message that
  says so. The `seneca.store` path of `seneca-entity` 1.x is removed.
* Behaviour changes, to pass the shared store tests: `save$` merges
  into the stored entity (disable with `merge: false`) and replies with
  a copy; `list$` accepts ids and arrays of values; `remove$` deletes
  only the first match unless `all$` is set, replies `null` unless
  `load$` is set, and no longer replies with the Redis result count.
* `lodash` moves from 4.15.0 to `^4.17.21`, which fixes known
  prototype-pollution advisories.
* Tests run with `@hapi/lab` 26, `@seneca/entity` 29 and
  `@seneca/store-test` 7 against Redis (`npm run services:up` starts
  `redis:8.10`); tested on Node.js 26 with Redis 7. CI is provided as a
  patch in `.patches/`.
* `package-lock.json` is no longer committed.
* Documentation reorganized into tutorials, how-to guides, reference
  and explanation under `docs/`.

## 1.1.0 26-08-2016

* Updated dependencies
* Added Seneca 3 and Node 6 support
* Dropped Node 0.10, 0.12, 5 support

## 1.0.1 2016-08-02

* Dependencies update to match Seneca dependencies

## 1.0.0 2016-05-23

* Replaced object mapping code with a serializer.
* Enhanced string connections.
* Update dependencies. Newer redis client.
