# Migrate from Seneca 3

Goal: keep using this store when the application moves to Seneca 4.

1. Upgrade the packages. Seneca 4 needs a current `seneca-entity`:

   ```sh
   npm install seneca@^4.0.0-rc5 seneca-entity@^28 seneca-redis-store@^1.2
   ```

   Version 1.2.0 of this plugin finds the store initializer through the
   `entity/init` export of current `seneca-entity`; older versions of
   the plugin needed `seneca.store`, which only `seneca-entity` 1.x set.

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
   Version 1.2.0 changed them to match `seneca-store-test` 6; see
   [Messages](../reference/messages.md#remove) and
   [Messages](../reference/messages.md#save).
