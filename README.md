# Wheel in the Sky 3

**Wheel in the Sky** is a wheel-based random selection tool. This is the 3rd major rewrite of the app.

Commits to the main branch are deployed to [wheel-in-the-sky.bri-9c5.workers.dev](https://wheel-in-the-sky.bri-9c5.workers.dev).

You can find the previous version of the wheel at [wheelinthesky.app](https://wheelinthesky.app). This new wheel will replace the previous one when it's complete.

### Stack

Wheel in the Sky is a [React](https://react.dev/) web application bundled with [Vite](https://vite.dev/) and deployed to [Cloudflare](https://www.cloudflare.com/) as static assets. There is no backend. Wheels are encoded and decoded in the browser. Wheel configurations are validated with [Zod](https://zod.dev/), and the code is written in [TypeScript](https://www.typescriptlang.org/).

### Development

#### Environment Setup

In order to run a local dev server, you'll need to create an environment file. It should not be committed into the repo.

Create the file `.env.local` and add these contents:

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

This starts the web app at [localhost:5173](http://localhost:5173/).

#### Running Unit Tests

To run unit tests in watch-mode using [Vitest](https://vitest.dev/), run the following command:

```bash
npm run test
```

#### Updating Dependencies

With the following command, you can run [npm-check-updates](https://github.com/raineorshine/npm-check-updates) over the project. This will provide a console UI to update dependencies.

```bash
npm run ncu
```

### Release Process

Any code committed into the `main` branch will be released to production. Code must be thoroughly checked before being merged to `main`. If a check fails at any stage, the process must be halted until the issue is resolved.

#### Committing Changes

Using lint-staged, each commit will run these step locally, which much pass before you can push your changes:

- Lint: Runs Oxlint on all staged files.
- Prettier: Formats all staged files.
- Vitest: Runs relavant unit tests for staged files.

#### Pull Requests

Push a branch and open a pull request. Github Actions will run these steps:

- Check Types: Ensure there are no TypeScript errors in the branch.
- Build: Build the app, stopping if there are errors.
- Test: Run all unit tests and report coverage.

#### Deploying

Merge your pull request. Github Actions will do the same steps again as it did for your feature branch. Additionally, if all steps pass, it will deploy the update to [CloudFlare](https://www.cloudflare.com/).
