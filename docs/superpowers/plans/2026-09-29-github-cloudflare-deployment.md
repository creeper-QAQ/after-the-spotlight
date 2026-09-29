# GitHub + Cloudflare Zero-Cost Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the unfinished site in a private GitHub repository, migrate its two local-only APIs to a Cloudflare Worker, and make `develop` pushes create previews while `main` pushes update the free production site.

**Architecture:** Web-standard request handlers are shared by the Vite development adapter and the Cloudflare Worker. Workers Static Assets serves `dist`; `/api/*` runs Worker code. GitHub is the source of truth, Cloudflare Workers Builds deploys `main` and previews `develop`.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Node 24 test runner, Playwright, Cloudflare Workers/Wrangler 4, GitHub private repository

**Spec:** `docs/superpowers/specs/2026-09-29-cloudflare-zero-cost-deployment-design.md`

## Global Constraints

- Cloudflare must remain on Workers Free; do not enable Workers Paid or any paid Cloudflare add-on.
- Use the free `*.workers.dev` URL; do not purchase or attach a custom domain.
- GitHub repository is private and named `creeper-QAQ/after-the-spotlight` unless that exact name is already occupied.
- `main` is production; `develop` is preview and the normal checked-out working branch.
- Never commit `.env.local`, `.dev.vars*`, `.wrangler/`, `dist/`, local backups, artifacts, raw investigation files, unlicensed media, or personal information.
- `DEEPSEEK_API_KEY` exists only in ignored local configuration and Cloudflare encrypted secrets.
- DeepSeek accepts 1–1200 characters and uses `deepseek-flash`, non-thinking mode, with `max_tokens: 320` and a 60-second timeout.
- Preserve Bilibili Range/HEAD behavior and the existing Chinese error messages.
- Follow `AGENTS.md`: save a named version before edits, never delete `.versions`, and run production build plus relevant browser tests before delivery.

## File Structure

- Create `src/server/deepseekReply.ts`: Web Request/Response handler for DeepSeek validation, upstream mapping, timeout, and streaming.
- Create `src/server/bilibiliAudio.ts`: Web handler for play-info lookup, Range forwarding, media headers, HEAD, and errors.
- Create `src/server/nodeAdapter.ts`: Connect/Vite request and response adapter only.
- Create `src/worker.ts`: `/api/*` router and `ASSETS` fallback.
- Create `tests/server/deepseek-reply.test.mjs`: deterministic DeepSeek handler tests with injected fetch.
- Create `tests/server/bilibili-audio.test.mjs`: deterministic audio proxy tests with injected fetch.
- Create `tests/server/worker-router.test.mjs`: API routing and static fallback tests.
- Create `tests/helpers/browser-network.mjs`: blocks or fulfills external media before browser navigation.
- Create `wrangler.jsonc`: free Worker, static assets, SPA fallback, API-first routes, preview URLs.
- Create `docs/deployment-cloudflare.md`: update, secret, verification, rollback, and shutdown instructions.
- Modify `vite.config.ts`: replace inline API implementations with shared handlers through `nodeAdapter`.
- Modify browser tests: use `TEST_BASE_URL`, deterministic external-media routes, and exact typewriter completion waits.
- Modify `package.json` and `package-lock.json`: Wrangler dependency and server-test scripts.
- Modify `.gitignore`: ignore `.dev.vars*` and `.wrangler/`.
- Modify `README.md` and `docs/verification.md`: document GitHub/Cloudflare workflow and verified public URLs.

## Review Focus

- Malformed, empty, or oversized DeepSeek input must return 400 and make zero upstream requests; pinned in Task 2.
- Missing Key, upstream 401/402/429/503, timeout, empty stream, and mid-stream failure must retain understandable responses; pinned in Task 2.
- Audio GET, HEAD, Range, missing source, and upstream 200/206/502 behavior must preserve correct status, headers, and body semantics; pinned in Task 3.
- Unknown paths and navigation requests must reach static assets, while `/api/*` never falls through to SPA HTML; pinned in Task 4.
- Neither Git history nor Cloudflare build logs/artifacts may contain the DeepSeek Key or excluded source material; pinned in Tasks 1, 5, and 6.

---

### Task 1: Freeze a Safe, Reproducible Website Baseline

**Files:**
- Modify: `.gitignore`
- Create: `tests/helpers/browser-network.mjs`
- Modify: `tests/browser.mjs`
- Modify: `tests/effects.mjs`
- Modify: `tests/games.mjs`
- Modify: `tests/reports.mjs`
- Modify: `tests/seal-physics.mjs`
- Modify: `tests/ai-reply.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `prepareBrowserPage(page: Page): Promise<void>` and `TEST_BASE_URL` support used by all browser suites.
- Produces: a clean, committed baseline containing the user's current intended website changes but none of the excluded files in Global Constraints.

- [ ] **Step 1: Save a named pre-edit version and inventory publishable changes**

Run: `npm run backup -- before-github-cloudflare-implementation`, `git status --short`, `git diff --name-only`, and `git ls-files --others --exclude-standard`.

Expected: every candidate path is inside `website`; `.env.local`, `dist`, `.versions`, `.recoveries`, `artifacts`, and raw collection folders are absent. Stop and remove any questionable path from the publish set before continuing.

- [ ] **Step 2: Extend ignore assertions before adding deployment tooling**

Add `.dev.vars`, `.dev.vars.*`, and `.wrangler/` to `.gitignore`. Run `git check-ignore -v .env.local .dev.vars .wrangler/state.json dist/index.html`.

Expected: every path is ignored by an explicit rule.

- [ ] **Step 3: Make browser-network failures reproducible**

Create `prepareBrowserPage(page)` to fulfill `**/api/bilibili-audio` with an empty media response and the Bilibili iframe URL with minimal HTML before navigation. Change each browser suite to call it, read `process.env.TEST_BASE_URL || 'http://127.0.0.1:5173'`, navigate with `domcontentloaded`, and wait for the first app-specific ready selector.

- [ ] **Step 4: Pin the AI typewriter regression**

In `tests/browser.mjs`, define the complete reply once and wait until `.letter-reply p` equals the complete string, including the final `。`, before asserting. Keep the earlier partial-text assertion to prove progressive typing.

- [ ] **Step 5: Run the local browser suites against a live Vite server**

Run the dev server, then run `npm run test:ai-reply`, `npm run test:effects`, `npm run test:games`, `node tests/reports.mjs`, `node tests/seal-physics.mjs`, and `npm run test:browser`.

Expected: every command exits 0; no request reaches the real Bilibili audio endpoint during deterministic browser tests.

- [ ] **Step 6: Format only changed source/test files and verify the full baseline**

Run: `npx prettier --write` for the files reported by `npm run format:check`, then `npm run format:check`, `npm run test:versions`, and `npm run build`.

Expected: formatting exits 0, version tests report 5 passes, and Vite build exits 0. Existing chunk-size warnings may remain documented but no error is allowed.

- [ ] **Step 7: Scan for secrets and commit the current website baseline**

Compare the local Key value against tracked files and `dist` without printing it. Run `git diff --check` and re-read the staged file list before committing.

Expected: Key match count is 0; staged paths contain no excluded materials.

Commit: `git commit -m "feat: checkpoint deployable data-news site"`

### Task 2: Extract and Test the DeepSeek Handler

**Files:**
- Create: `tests/server/deepseek-reply.test.mjs`
- Create: `src/server/deepseekReply.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `type DeepseekEnv = { DEEPSEEK_API_KEY?: string }`.
- Produces: `type DeepseekOptions = { fetchImpl?: typeof fetch; timeoutMs?: number }` and `handleDeepseekReply(request: Request, env: DeepseekEnv, options?: DeepseekOptions): Promise<Response>`; production defaults to the global fetch and 60,000 ms.
- Consumes: a POST Request with JSON `{ message: string }`; returns JSON errors or a `text/event-stream` Response.

- [ ] **Step 1: Write failing validation and authorization tests**

Test names and assertions: `rejects non-POST with 405`, `rejects malformed JSON with 400`, `rejects blank and 1201-character messages with 400`, and `returns 503 when DEEPSEEK_API_KEY is absent`; each asserts the injected fetch call count remains 0.

- [ ] **Step 2: Run validation tests and verify RED**

Run: `node --test tests/server/deepseek-reply.test.mjs`.

Expected: FAIL because `src/server/deepseekReply.ts` does not exist.

- [ ] **Step 3: Implement the minimal validation surface**

Implement the exported type and function signature above, returning UTF-8 JSON errors with the existing Chinese copy and no upstream call for invalid requests.

- [ ] **Step 4: Run validation tests and verify GREEN**

Run: `node --test tests/server/deepseek-reply.test.mjs`.

Expected: the four validation tests pass.

- [ ] **Step 5: Add failing upstream and stream tests**

Add tests asserting the upstream request uses Bearer auth, `deepseek-flash`, `stream: true`, disabled thinking, and `max_tokens: 320`; 401, 402, 429, and 503 map to existing Chinese errors; successful SSE bytes and content type pass through; empty body becomes 502; a stream failure remains observable by the frontend; and an aborted request becomes 504 using `timeoutMs: 1`. Use injected fetch and fake Responses, never the real API.

- [ ] **Step 6: Run the expanded test and verify RED**

Expected: FAIL on missing upstream mapping/stream behavior.

- [ ] **Step 7: Implement minimal upstream mapping, timeout, and streaming**

Use a per-request `AbortController`; clear its timer on every terminal path. Never log the authorization header, request body, or Key.

- [ ] **Step 8: Run server tests and commit**

Run: `node --test tests/server/deepseek-reply.test.mjs` and `npm run build`.

Expected: all DeepSeek tests and TypeScript build pass.

Commit: `git commit -m "feat: add portable DeepSeek reply handler"`

### Task 3: Extract and Test the Bilibili Audio Handler

**Files:**
- Create: `tests/server/bilibili-audio.test.mjs`
- Create: `src/server/bilibiliAudio.ts`

**Interfaces:**
- Produces: `handleBilibiliAudio(request: Request, fetchImpl?: typeof fetch): Promise<Response>`.
- Consumes: GET or HEAD plus optional `Range`; returns upstream media or UTF-8 JSON error.

- [ ] **Step 1: Write failing method and play-info tests**

Test names and assertions: `rejects unsupported methods with 405`, `uses the fixed BV/cid play-info endpoint`, `returns 502 for nonzero play-info code`, and `returns 502 when no audio source exists`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/server/bilibili-audio.test.mjs`.

Expected: FAIL because the handler module does not exist.

- [ ] **Step 3: Implement play-info lookup and validation**

Implement the exported signature above with the existing Bilibili video identifiers, Referer, and User-Agent behavior.

- [ ] **Step 4: Add failing Range, HEAD, and error tests**

Assert Range is forwarded; 200/206 status and `accept-ranges`, `content-length`, `content-range`, `content-type`, `etag`, and `last-modified` are copied; `Cache-Control` is `private, max-age=300`; HEAD has no body; failed media fetch returns 502.

- [ ] **Step 5: Implement media forwarding and verify GREEN**

Run: `node --test tests/server/bilibili-audio.test.mjs` and `npm run build`.

Expected: all audio tests and build pass.

- [ ] **Step 6: Commit**

Commit: `git commit -m "feat: add portable Bilibili audio proxy"`

### Task 4: Wire Local Vite and Cloudflare Worker Runtimes

**Files:**
- Create: `tests/server/worker-router.test.mjs`
- Create: `src/server/nodeAdapter.ts`
- Create: `src/worker.ts`
- Create: `wrangler.jsonc`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `toWebRequest(req: IncomingMessage, origin: string): Promise<Request>`.
- Produces: `sendWebResponse(response: Response, res: ServerResponse): Promise<void>`.
- Produces: `type WorkerEnv = DeepseekEnv & { ASSETS: { fetch(request: Request): Promise<Response> } }`.
- Produces: `handleWorkerRequest(request: Request, env: WorkerEnv, fetchImpl?: typeof fetch): Promise<Response>` and the default Worker export.
- Consumes: handlers from Tasks 2 and 3.

- [ ] **Step 1: Write failing Worker routing tests**

Assert `/api/deepseek-reply` and `/api/bilibili-audio` call only their handler path; unknown `/api/*` returns JSON 404 rather than SPA HTML; all non-API paths call `env.ASSETS.fetch(request)` exactly once.

- [ ] **Step 2: Run routing tests and verify RED**

Run: `node --test tests/server/worker-router.test.mjs`.

Expected: FAIL because `src/worker.ts` does not exist.

- [ ] **Step 3: Implement Worker routing and static fallback**

Implement the interfaces above. Keep the default export limited to `fetch(request, env)` delegating to `handleWorkerRequest`.

- [ ] **Step 4: Add Wrangler 4 and deployment configuration**

Install `wrangler@^4.34.0` as a dev dependency. Create `wrangler.jsonc` with name `after-the-spotlight`, main `src/worker.ts`, compatibility date `2026-09-29`, `workers_dev: true`, `preview_urls: true`, and assets directory `./dist` with binding `ASSETS`, SPA fallback, and `run_worker_first: ["/api/*"]`.

- [ ] **Step 5: Replace Vite's duplicated middleware bodies with the Node adapter**

Keep the same local paths and method fallthrough semantics. The adapter must copy status and headers, stream Response bodies, and end cleanly for HEAD/no-body responses.

- [ ] **Step 6: Verify local runtime and Worker dry run**

Run: `node --test tests/server/*.test.mjs`, `npm run build`, and `npx wrangler deploy --dry-run --outdir .wrangler-dry-run`.

Expected: tests pass; build exits 0; Wrangler reports a bundle below the 64 MiB free limit and does not contact production.

- [ ] **Step 7: Re-run browser and live local API tests**

With Vite running, run all Task 1 browser suites plus `npm run test:bilibili-audio`. For the real DeepSeek smoke test, submit one short prompt through the page using the existing local Key.

Expected: browser suites pass; audio returns media content; one DeepSeek reply streams to completion; Key is absent from console and `dist`.

- [ ] **Step 8: Commit**

Commit: `git commit -m "feat: run site and APIs on Cloudflare Worker"`

### Task 5: Create the Private GitHub Repository and Branch Flow

**Files:**
- Modify: Git refs and remote configuration only

**Interfaces:**
- Produces: private `creeper-QAQ/after-the-spotlight` with `main` and `develop`.
- Produces: local `origin` pointing to that exact repository and local checkout on `develop`.

- [ ] **Step 1: Verify the repository is clean and safe to publish**

Run the full verification from Task 4, `git status --short`, `git ls-files`, and the secret comparison scan.

Expected: clean working tree; zero secret matches; no excluded files in `git ls-files`.

- [ ] **Step 2: Rename the current branch to `main`**

Run: `git branch -m master main` only if the current branch is still `master`; otherwise verify it is `main`.

- [ ] **Step 3: Create the empty private GitHub repository**

Because GitHub CLI is not installed and the current GitHub connector cannot create repositories, open GitHub's new-repository form under `creeper-QAQ`; the user creates `after-the-spotlight` as **Private** with no README, license, or `.gitignore` initialization.

Expected: `https://github.com/creeper-QAQ/after-the-spotlight` exists and is private.

- [ ] **Step 4: Add the remote and push production history**

Run: `git remote add origin https://github.com/creeper-QAQ/after-the-spotlight.git` and `git push -u origin main`.

Expected: remote `main` points at the verified Worker migration commit.

- [ ] **Step 5: Create and push the development branch**

Run: `git switch -c develop` and `git push -u origin develop`.

Expected: both branches exist remotely; local checkout is `develop`.

- [ ] **Step 6: Verify GitHub privacy and contents**

Use the GitHub connector to read repository metadata and `.gitignore`, list the root tree, and confirm `.env.local`, `.dev.vars`, `dist`, `.versions`, `.recoveries`, and `artifacts` are absent.

### Task 6: Connect Cloudflare Free Builds and Secrets

**Files:**
- Modify: Cloudflare account/project settings only

**Interfaces:**
- Consumes: private GitHub repository from Task 5 and `wrangler.jsonc` from Task 4.
- Produces: Worker project `after-the-spotlight`, a production `workers.dev` URL, and branch Preview Builds.

- [ ] **Step 1: Authenticate through official Cloudflare OAuth**

Run `npx wrangler login`; the user logs in and approves in the official browser page. Then run `npx wrangler whoami`.

Expected: the intended Cloudflare account is shown; no password or token appears in chat or logs.

- [ ] **Step 2: Confirm the account is on Workers Free**

Open Workers & Pages account overview and verify no Workers Paid subscription or paid add-on is enabled. Stop if the dashboard requests a paid upgrade.

- [ ] **Step 3: Import the private GitHub repository**

In Workers & Pages, select Import a repository, authorize Cloudflare's GitHub app for only `creeper-QAQ/after-the-spotlight`, and create Worker `after-the-spotlight`.

Set root directory `/`, production branch `main`, build command `npm run build`, deploy command `npx wrangler deploy`, and preview command `npx wrangler preview`. Enable Preview Builds for non-production branches.

- [ ] **Step 4: Configure production and preview secrets**

Add `DEEPSEEK_API_KEY` as an encrypted runtime secret for production and Preview settings. Enter it from `.env.local` without printing or copying it into GitHub/build variables.

- [ ] **Step 5: Trigger and inspect a `develop` preview build**

Create an empty `develop` commit only if needed to trigger the first preview, then push it. Inspect build logs for `npm ci`, `npm run build`, and `npx wrangler preview` success.

Expected: a stable Preview URL exists; no secret value appears in logs; production remains unchanged until `main` is updated.

### Task 7: Verify Preview, Promote to Production, and Document Operations

**Files:**
- Create: `docs/deployment-cloudflare.md`
- Modify: `README.md`
- Modify: `docs/verification.md`

**Interfaces:**
- Consumes: Preview and production URLs from Task 6.
- Produces: verified live site, repeatable update instructions, and an explicit 10–15 day shutdown procedure.

- [ ] **Step 1: Test the Preview URL as deployed software**

Set `TEST_BASE_URL` to the Preview URL and run the browser suites. Fetch `/api/bilibili-audio` with `Range: bytes=0-2047`; submit one short DeepSeek prompt; test an invalid empty/oversized request without model invocation.

Expected: desktop/mobile suites pass; audio response is media; DeepSeek streams; invalid input returns 400; unknown `/api/*` returns JSON 404.

- [ ] **Step 2: Verify privacy and deployment evidence**

Confirm the GitHub repo remains private, source commit matches the Cloudflare preview build, the Key is absent from GitHub/build output/browser JavaScript, and the project is still Workers Free.

- [ ] **Step 3: Document update and shutdown operations**

Write `docs/deployment-cloudflare.md` with: develop-preview-main flow, build commands, where secrets live, how to inspect failures, how to roll back to a prior Cloudflare deployment, and how to disable `workers.dev` plus disconnect Git builds after 10–15 days. Update README and verification evidence without recording secret values.

- [ ] **Step 4: Run final local verification and commit documentation**

Run: `npm run format:check`, `npm run test:versions`, `node --test tests/server/*.test.mjs`, `npm run build`, and all browser suites against local Vite.

Expected: all commands exit 0, with only the documented Vite chunk-size warning allowed.

Commit: `git commit -m "docs: add Cloudflare deployment operations"`, then push `develop` and confirm its Preview updates.

- [ ] **Step 5: Promote the verified commit to production**

Run: `git switch main`, `git merge --ff-only develop`, and `git push origin main`.

Expected: Cloudflare production build succeeds automatically from the same commit verified on Preview.

- [ ] **Step 6: Verify the public production URL**

Repeat the homepage, mobile, audio Range, DeepSeek one-call, invalid-input, WebGL fallback, and secret-absence checks against the production `workers.dev` URL. Report the URL, commit SHA, Cloudflare build result, and date in the final handoff; do not create a post-promotion source change that would make the verified commit differ from production.

- [ ] **Step 7: Return to `develop` and save the delivered version**

Run: `git switch develop`, verify `git rev-parse develop` equals `git rev-parse main`, and run `npm run backup -- github-cloudflare-live`.

Expected: local work resumes on `develop`; `main` equals the verified production commit; the named backup exists and passes `npm run versions` listing.
