# Wheel in the Sky 3

**Wheel in the Sky** is a wheel-based random selection tool. This is the 3rd major rewrite of the app.

Commits to the main branch are deployed to [wheel-in-the-sky.bri-9c5.workers.dev](https://wheel-in-the-sky.bri-9c5.workers.dev).

You can find the previous version of the wheel at [wheelinthesky.app](https://wheelinthesky.app). This new wheel will replace the previous one when it's complete.

### Apps and Packages

This application is a monorepo managed by [Turborepo](https://turbo.build/repo/docs).

- `web`: A [React](https://react.dev/)-based web application bundled with [Vite](https://vite.dev/).
- `api`: A [Hono](https://hono.dev/) application shell.
- `@repo/api-handlers`: [Hono](https://hono.dev/) route handlers that are imported into the `api` application. Also exports a client library to the `web` application.
- `@repo/eslint`: Composable shared [ESLint] configurations for the project.
- `@repo/lint-staged`: [lint-staged](https://github.com/lint-staged/lint-staged) configurations shared to each package.
- `@repo/prettier`: [Prettier](https://prettier.io/) configurations for frontend and backend work.
- `@repo/shared`: Includes additional code that is used by the frontend and backend, including enums, types, and [Zod](https://zod.dev/) validators.

Each package/app uses [TypeScript](https://www.typescriptlang.org/).

### Development

Turborepo is able to watch each package and rebuild relevant packages based on changes.

#### Environment Setup

In order to run a local dev server, you'll need to create some environment files. These should not be committed into the repo.

Create the file `apps/api/.dev.vars` and add these contents:

```env
APP_ENV=local
```

Create the file `apps/web/.env.local` and add these contents:

```env
VITE_APP_ENV=local
```

To install dependencies, run:

```bash
npm install
```

#### Running a Local Dev Server

To build the app in watch-mode and run dev server, run the following command:

```bash
npm run dev
```

This will build relevant packages and start the web app at [localhost:5173](http://localhost:5173/) and the api at [localhost:8787](http://localhost:8787/).

If it's your first time running the app locally, you may get an error. Trying running a full build first (it's an issue with the order that Turbo creates files, I'll probably fix it eventually):

```bash
npm run build
```

You should only need to do this once. You should be able to run the `dev` command without issue from then on.

#### Running Unit Tests

To run unit tests in watch-mode using [Vitest](https://vitest.dev/), run the following command:

```bash
npm run test
```

#### Updating Dependencies

With the following command, you can run [npm-check-updates](https://github.com/raineorshine/npm-check-updates) sequentially over each repo. This will provide a console UI to update dependencies.

```bash
npm run ncu
```

### Release Process

Any code committed into the `main` branch will be released to production. Code must be thoroughly checked before being merged to `main`. If a check fails at any stage, the process must be halted until the issue is resolved.

#### Committing Changes

Using lint-staged, each commit will run these step locally, which much pass before you can push your changes:

- Lint: Runs ESLint on all staged files.
- Prettier: Formats all staged files.
- Vitest: Runs relavant unit tests for staged files.

#### Pull Requests

Push a branch and open a pull request. Github Actions will run these steps:

- [Sherif](https://github.com/QuiiBz/sherif): Detect if dependencies between packages no longer match.
- Check Types: Ensure there are no TypeScript errors in the branch.
- Build: Build every package and app, stopping if there are errors.
- Test: Run all unit tests and report coverage.

#### Deploying

Merge your pull request. Github Actions will do the same steps again as it did for your feature branch. Additionally, if all steps pass, it will deploy the update to [CloudFlare](https://www.cloudflare.com/).
