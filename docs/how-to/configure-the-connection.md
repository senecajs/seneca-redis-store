# Configure the connection

Goal: connect the store to your Redis server and database.

1. Pass a Redis URI. Credentials and port go in the URI:

   ```js
   seneca.use('seneca-redis-store', { uri: 'redis://user:pass@redis.example:6379' })
   ```

   Without `uri` the plugin connects to the client default,
   `127.0.0.1:6379`.

2. Pass options for the `redis` client (version 2) in `options`. They
   are the second argument of `redis.createClient(uri, options)`. For
   example, `prefix` puts a prefix in front of every hash name:

   ```js
   seneca.use('seneca-redis-store', {
     uri: 'redis://127.0.0.1:6379',
     options: { prefix: 'app:' },
   })
   ```

3. Choose a database number with `db`. The plugin runs `SELECT <db>`
   after connecting:

   ```js
   seneca.use('seneca-redis-store', { uri: 'redis://127.0.0.1:6379', db: 3 })
   ```

4. Turn off merging on save if an update must replace the whole stored
   entity:

   ```js
   seneca.use('seneca-redis-store', { uri: 'redis://127.0.0.1:6379', merge: false })
   ```

5. Register the plugin options in the Seneca options instead, if you
   prefer. On Seneca 4 they must go under `plugin`:

   ```js
   const seneca = Seneca({
     plugin: { 'redis-store': { uri: 'redis://127.0.0.1:6379' } },
   })
   ```

See [Options](../reference/options.md) for every option.
