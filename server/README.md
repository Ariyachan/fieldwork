# Fieldwork API

An independent TypeScript/Express service for the Fieldwork interface. Better Auth owns passwords, registration, login and persisted sessions. PostgreSQL owns each user's workspace. The frontend seed is copied from `../src/data.ts` into `seed.json`; it is inserted once for a new user and never overwrites an existing workspace.

## Run locally

Requires Node.js 22.18+ and PostgreSQL. Install with `npm ci`. Copy `.env.example` to `.env.local` or provide the environment variables through your process manager. All runtime scripts load optional `.env` first, then `.env.local` through Node's native `--env-file` support. Both real configuration files are ignored by Git. Supply `DATABASE_URL`, a randomly generated `BETTER_AUTH_SECRET` of at least 32 characters, `BETTER_AUTH_URL`, and the comma-separated `TRUSTED_ORIGINS` allowlist. No usable password or secret is committed, and the service does not generate a fallback secret. Keep the same secret between restarts. Existing process environment variables take precedence over file values.

```sh
npm run migrate
npm run dev
```

`npm start` runs without file watching. Defaults are `127.0.0.1:4100`. The frontend Vite development server proxies `/api` to this service, so browser requests keep a same-origin session cookie. For direct cross-origin development, both server CORS and Better Auth use `TRUSTED_ORIGINS`. In production, serve the UI and `/api` behind one HTTPS origin and configure that origin explicitly.

For a combined production service, `STATIC_DIR` selects the built frontend directory, defaulting to `../dist` resolved from the server process's working directory. With a container working directory of `/app/server`, this selects `/app/dist`. If that directory exists, Express's standard static middleware serves it at `/fieldwork`, including its index and assets, and `/` redirects to `/fieldwork/`. Missing assets return 404; there is no catch-all index fallback and API authentication/404 responses keep their existing behavior. If the directory is absent, only the API is mounted, so local Vite development continues normally. Configure the frontend build base as `/fieldwork/`.

The migration calls Better Auth's supported `getMigrations(auth.options)` API, then creates the application's `workspaces` table. It can be run again. A first migration may report missing Better Auth tables during initial schema validation before the migration creates them; subsequent schema checks must be clean. Run migrations before starting the API.

## HTTP contract

`GET /api/health` is public and returns `{ "status": "ok" }` only after a real PostgreSQL query. Every workspace/project endpoint requires a valid Better Auth session and returns 401 otherwise. Authentication endpoints are Better Auth's standard `/api/auth/*` endpoints, including:

- `POST /api/auth/sign-up/email`: `{name,email,password}`; password minimum 12 characters.
- `POST /api/auth/sign-in/email`: `{email,password}`.
- `POST /api/auth/sign-out`: `{}`.
- `GET /api/auth/get-session`.

Send JSON bodies and include credentials in browser requests. No application route accepts a caller-supplied user ID; the verified session determines ownership.

| Method and path | Body | Successful response |
| --- | --- | --- |
| `GET /api/workspace` | — | `{workspace:{projects,tasks,reviews},revision}` |
| `PUT /api/workspace` | `{workspace,revision}` | Saved workspace and incremented revision |
| `GET /api/projects` | — | `{projects,revision}` |
| `GET /api/projects/:id` | — | `{project,revision}` |
| `POST /api/projects` | Complete Project, including unique `id` | 201 `{project,revision}` |
| `PATCH /api/projects/:id` | Nonempty partial Project, excluding `id` | `{project,revision}` |
| `DELETE /api/projects/:id` | — | Workspace and revision after deleting the project and its tasks/reviews |

Project endpoints operate on the same snapshot as `/api/workspace`. Atomic PostgreSQL row updates reject a stale workspace revision with 409. Project mutations lock the owner's row for their complete transaction and increment its revision, so an older frontend snapshot cannot silently overwrite them. A project absent from the signed-in user's workspace returns 404 even if another user owns that identifier.

All fields are validated with strict Zod schemas, including valid calendar dates, finite coordinates, known statuses and member IDs (including comment authors), bounded strings and arrays, safe identifiers, unique IDs, and task/review project references. Approved reviews must have all comments resolved. Malformed or invalid writes return 400 and retain the previous snapshot. Duplicate project creation returns 409. Foreign write origins return 403. Request bodies are limited to 2 MB. Internal database errors return a generic 500 response and are logged server-side; they are never reported as a successful save.

## Checks

```sh
npm run typecheck
npm test
```

Tests require `TEST_DATABASE_URL` or `DATABASE_URL`; they fail if no real PostgreSQL connection is supplied. They create random test users, use actual HTTP calls against a listening Express server, and delete only those users at the end. Their workspace/session records cascade on deletion. Coverage includes email registration, password hashing by Better Auth, two-user isolation, project create/read/update/delete, invalid data retaining prior values, concurrent revision conflict, logout, rejected password, login, and rebuilding the server/pool against the same persisted database. The public health route verifies connectivity. These are local functional checks, not a claim of a production deployment or an independent security audit.

The static-hosting test uses a temporary frontend fixture to check the root redirect, index and asset serving, missing-file 404, an absent static directory, and unchanged authentication requirements on API paths.

Official references used: [Better Auth Express integration](https://better-auth.com/docs/integrations/express), [PostgreSQL adapter](https://better-auth.com/docs/adapters/postgresql), [programmatic migrations](https://better-auth.com/docs/concepts/database), [node-postgres transactions](https://node-postgres.com/features/transactions), [Zod schemas](https://zod.dev/api), and [Express static files](https://expressjs.com/en/starter/static-files/).
