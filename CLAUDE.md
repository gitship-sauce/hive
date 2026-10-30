@AGENTS.md

# Rules for this project

Read `PLAN.md` for what we are building and `tasks.md` for what to do next.

## How to work
- Do **one task** from `tasks.md` at a time: the first one that is not `[x]`.
- Mark it `[~]` when you start. Show a short plan before writing code.
- Write the test from the task's **Done when** line, not from your code.
- Run `npm run check` (lint, types, unit tests). Run `npm run e2e` when the task touches pages. Tick `[x]` only when everything is green.
- One commit per task, message `T<id>: <what changed>`.
- Found a bug or a missing piece? Add it to "Found while building" as a new task. Don't fix it silently inside another task.
- Ask before adding a package that isn't in `PLAN.md`.

## Code rules
- Never render user text as HTML. No `dangerouslySetInnerHTML` on anything a user typed.
- Check every input with zod on the server, even if the form already checks it.
- Every server action and API route checks the session itself. Never trust a user id sent by the browser.
- Don't swallow errors. Show the user a clear message, and log the real error on the server.
- No secrets in git. Real values go in `.env`, placeholders in `.env.example`.

## Commands
- `docker compose up -d db`: start Postgres
- `npm run dev`: start the app with live reload (http://localhost:3000)
- `npm run db:migrate`: apply database migrations
- `npm run check`: lint + typecheck + unit tests
- `npm run e2e`: browser tests
- `docker compose up --build`: run everything the way a viewer does
