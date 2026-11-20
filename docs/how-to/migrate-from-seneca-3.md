# Migrate from Seneca 3

Goal: keep using this store when the application moves to Seneca 4.

1. Upgrade the packages. Seneca 4 needs `@seneca/entity` in place of
   `seneca-entity`, and this plugin is now `@seneca/redis-store`:

   ```sh
   npm uninstall seneca-entity seneca-redis-store
   npm install seneca@^4 @seneca/entity @seneca/redis-store
   ```

   Load both by their full names, `@seneca/entity` first:

   ```js
   seneca.use('@seneca/entity').use('@seneca/redis-store', options)
   ```

   Version 2 registers the store through the `entity/init` export of
   `@seneca/entity`. Older versions of the plugin needed `seneca.store`,
   which only `seneca-entity` 1.x set.

2. Move top level plugin options. Seneca 3 merged `options['redis-store']`
   into the plugin options; Seneca 4 does not. Pass the options to
   `use()` or put them under `plugin`:

   ```js
   // Seneca 3 only:
   Seneca({ 'redis-store': { uri: 'redis://127.0.0.1:6379' } })

   // Seneca 3 and 4:
   Seneca({ plugin: { 'redis-store': { uri: 'redis://127.0.0.1:6379' } } })
   ```

3. Check error handling. On Seneca 4 an error reaches the callback as
   the original error, not wrapped in a `seneca: Action ... failed`
   error. Read `err.message` and `err.code` directly.

4. Check code that relied on the 1.1 behaviour of `remove$` and `save$`.
   Version 2.0.0 changed them to match `@seneca/store-test`; see
   [Messages](../reference/messages.md#remove) and
   [Messages](../reference/messages.md#save).
