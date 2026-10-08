## 1.2.0 2026-10-08

* Seneca 4 prerelease support (`seneca@4.0.0-rc5` and later), with
  `seneca-entity` 28. Seneca 3 is still supported.
* Node.js 24 and 22 are the tested versions; `engines.node` is `>=18`.
* The store initializer is taken from the `entity/init` export when
  `seneca.store` is not present.
* Behaviour changes, to pass `seneca-store-test` 6: `save$` merges into
  the stored entity (disable with `merge: false`) and replies with a
  copy; `list$` accepts ids and arrays of values; `remove$` deletes only
  the first match unless `all$` is set, replies `null` unless `load$`
  is set, and no longer replies with the Redis result count.
* Tests run with `@hapi/lab` 26 and `seneca-store-test` 6 against
  `redis:8.10` started with `docker compose` (`npm run services:up`).
  CI is provided as a patch in `.patches/`.
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
