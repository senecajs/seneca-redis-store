# Errors

The plugin raises errors with `seneca.fail`. On Seneca 4, `seneca.fail`
called with an object as its first argument produces an error with code
`unknown` and message `seneca: unknown`; the codes below are what the
plugin requests.

## entity/error

A Redis command used by `save$`, `load$`, `list$` or `remove$` returned
an error. The error is passed to the entity callback. A connection
error also starts a reconnect (see
[minwait and maxwait](options.md#minwait-and-maxwait)).

## seneca-redis/configure

The Redis client emitted an `error` event, for example when the server
cannot be reached. It is raised without a callback, so it is thrown from
the client event handler and, on Seneca 4, ends the process.

## entity/configure

Creating the client during [init:redis-store](messages.md#initredis-store)
failed. Plugin loading fails with it.
