# Run the tests locally

Goal: run the test suite against a real Redis server.

1. Use Node.js 24 (or 22) and install the dependencies:

   ```sh
   npm install
   ```

   The `devDependencies` install the Seneca 4 prerelease
   (`seneca@^4.0.0-rc5`), `seneca-entity` and `seneca-store-test`.

2. Start Redis with Docker:

   ```sh
   npm run services:up
   ```

   This runs `docker compose up -d --wait`. The compose project is
   `seneca-redis-store`; the container `seneca-redis-store-redis` runs
   `redis:8.10` with host port 16380 and waits for `redis-cli ping`.

3. Run the tests:

   ```sh
   npm test
   ```

   `npm test` does not start Docker. It reads these variables:

   | Variable | Default | Meaning |
   | -------- | ------- | ------- |
   | `SENECA_TEST_REDIS_HOST` | `127.0.0.1` | Redis host. |
   | `SENECA_TEST_REDIS_PORT` | `16380` | Redis port. |

   To use another Redis server:

   ```sh
   SENECA_TEST_REDIS_HOST=10.0.0.5 SENECA_TEST_REDIS_PORT=6379 npm test
   ```

4. Optionally test another Seneca build, then restore the default:

   ```sh
   npm install --no-save /path/to/seneca-4.0.0.tgz
   npm test
   npm install
   ```

5. Stop Redis and remove its volume:

   ```sh
   npm run services:down
   ```

In GitHub Actions the same Redis image runs as a service container on
the same port; the workflow is in `.patches/`.
