# Workflow patches

GitHub requires the `workflow` OAuth scope to add or change files under
`.github/workflows/`. The session that prepared this branch did not have
it, so the workflow file is provided here as a git patch instead.

Apply it from a checkout with normal credentials:

```sh
git am .patches/*.patch
git rm -r .patches
git commit -m "ci: remove applied workflow patches"
git push
```

| Patch | Adds |
| ----- | ---- |
| `0001-ci-add-the-build-workflow-with-a-Redis-service-conta.patch` | `.github/workflows/build.yml`: runs `npm test` on Node.js 24 and 22 with a `redis:8.10` service container on host port 16380. The container health check is `redis-cli ping`. |

`git apply --check .patches/*.patch` verifies that the patch applies.
