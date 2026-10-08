# Options

Pass options to `seneca.use('seneca-redis-store', { ... })`, or under
`options.plugin['redis-store']`. Top level `options['redis-store']` is
read by Seneca 3 only.

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `uri` | string | none | Redis URI passed to `redis.createClient`. |
| `options` | object | none | Client options, used only together with `uri`. |
| `db` | number | none | Database number selected after connecting. |
| `minwait` | number | `16` | Milliseconds; non zero enables reconnect attempts. |
| `maxwait` | number | `65336` | Milliseconds; upper bound of the reconnect wait. |
| `merge` | boolean | `true` | `false` makes `save$` replace stored entities. |

The `seneca-entity` store options (for example `map`, which limits the
store to some entity types) are also accepted; they are handled by
`seneca-entity`.

## uri

A Redis URI such as `redis://user:pass@host:6379`. Without `uri` the
plugin calls `redis.createClient()` with no arguments, which connects to
`127.0.0.1:6379`.

## options

An object passed as the second argument to
`redis.createClient(uri, options)` of the `redis` package, version 2.
For example `{ prefix: 'app:' }` prefixes every hash name. It is ignored
when `uri` is not set.

## db

When set, the plugin sends `SELECT <db>` after creating the client.

## minwait and maxwait

When a Redis command fails with `ECONNREFUSED` or a `notConnected`
error, the plugin creates a new client. If that fails it retries,
doubling the wait each time up to `maxwait`. `minwait` must be non zero
for this to happen; both default when they are `0` or unset.

## merge

`save$` on an entity with an id reads the stored entity and writes the
stored fields merged with the new ones, so fields missing from the
update are kept. With `merge: false` the new data replaces the stored
entity. A field set to `null` is stored as `null`; a field set to
`undefined` is not written.
