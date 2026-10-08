# seneca-redis-store documentation

The documentation follows the [Diátaxis](https://diataxis.fr/) structure.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started](tutorials/getting-started.md) | A program that saves, loads, lists and removes entities in Redis. |

The programs are in [examples](examples/).

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Configure the connection](how-to/configure-the-connection.md) | URI, Redis client options, database number, merge. |
| [Run the tests locally](how-to/run-the-tests-locally.md) | Docker Redis, environment variables, Seneca versions. |
| [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) | What changes when the application moves to Seneca 4. |
| [Create a release](how-to/create-a-release.md) | For maintainers. |

## Reference

| Reference | Describes |
| --------- | --------- |
| [Options](reference/options.md) | Every plugin option. |
| [Messages](reference/messages.md) | Every entity operation and the plugin's own action. |
| [Errors](reference/errors.md) | Error codes raised by the plugin. |

## Explanation

| Page | Explains |
| ---- | -------- |
| [How the store works](explanation/how-the-store-works.md) | Data layout, queries, lifecycle, limits, Seneca 3 and 4. |

## Feature index

| Feature | Kind | Documented in |
| ------- | ---- | ------------- |
| `uri` | option | [Options](reference/options.md#uri) |
| `options` | option | [Options](reference/options.md#options) |
| `db` | option | [Options](reference/options.md#db) |
| `minwait` | option | [Options](reference/options.md#minwait-and-maxwait) |
| `maxwait` | option | [Options](reference/options.md#minwait-and-maxwait) |
| `merge` | option | [Options](reference/options.md#merge) |
| `init:redis-store` | action pattern | [Messages](reference/messages.md#initredis-store) |
| `save$` (`sys:entity,cmd:save`) | entity operation | [Messages](reference/messages.md#save) |
| `load$` (`sys:entity,cmd:load`) | entity operation | [Messages](reference/messages.md#load) |
| `list$` (`sys:entity,cmd:list`) | entity operation | [Messages](reference/messages.md#list) |
| `remove$` (`sys:entity,cmd:remove`) | entity operation | [Messages](reference/messages.md#remove) |
| `native$` (`sys:entity,cmd:native`) | entity operation | [Messages](reference/messages.md#native) |
| close (on `sys:seneca,cmd:close`) | entity operation | [Messages](reference/messages.md#close) |
| plugin return value `{ name, tag }` | export | [Messages](reference/messages.md#plugin-definition) |
| `entity/error` | error code | [Errors](reference/errors.md#entityerror) |
| `seneca-redis/configure` | error code | [Errors](reference/errors.md#seneca-redisconfigure) |
| `entity/configure` | error code | [Errors](reference/errors.md#entityconfigure) |
| `SENECA_TEST_REDIS_HOST`, `SENECA_TEST_REDIS_PORT` | test environment | [Run the tests locally](how-to/run-the-tests-locally.md) |
