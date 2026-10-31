# Tasks

`[ ]` to do · `[~]` doing · `[x]` done (tests green, committed)

## 0. Setup
- [x] **T0.1** Create the Next.js app (TypeScript, Tailwind, ESLint, App Router).
  Done when: `npm run dev` shows the start page and `npm run lint` passes.
- [x] **T0.2** Postgres in Docker (`docker-compose.yml` service `db`, saved in a named volume).
  Done when: `docker compose up -d db` starts a healthy database, and its data is still there after `down` and `up`.
- [x] **T0.3** Drizzle connected, with the users and sessions tables and a first migration.
  Done when: `npm run db:migrate` creates the tables, and a test can insert and read back a user.
- [x] **T0.4** Test setup: Vitest on a separate test database, Playwright, and `npm run check`.
  Done when: `npm run check` runs lint, types and one passing test, and `npm run e2e` opens the home page.

## 1. Sign up and log in
- [x] **T1.1** Sign up with username and password.
  Done when: a new user can sign up and lands on the feed logged in; a taken username, bad characters or a password under 8 characters each show a clear error; the password is stored only as a bcrypt hash.
- [x] **T1.2** Log in and log out.
  Done when: the right password logs in; a wrong one shows "Wrong username or password"; log out ends the session in the database and the cookie stops working.
- [x] **T1.3** Pages need a login.
  Done when: a logged-out visitor to `/`, `/search`, `/messages` or `/notifications` is sent to `/login`.

## 2. Posts and feed
- [x] **T2.1** Write a post.
  Done when: a post of 1–280 characters is saved for the logged-in user; an empty or too-long post shows an error and saves nothing.
- [x] **T2.2** The feed.
  Done when: the feed shows my posts and the posts of people I follow, newest first, and never posts of people I don't follow.

## 3. Profile, follow and unfollow
- [x] **T3.1** Profile page `/u/[username]`.
  Done when: it shows the user's posts and follower and following counts; an unknown username shows "User not found" and is marked noindex.
- [ ] **T3.2** Follow and unfollow.
  Done when: Follow adds one row and the counts go up; Unfollow removes it; following twice still gives one row; you can't follow yourself.

## 4. Search
- [ ] **T4.1** Search users.
  Done when: typing part of a username lists matching users (case doesn't matter, up to 20); symbols like `%` and `_` are searched as plain text.

## 5. Messages (live)
- [ ] **T5.1** Our own server with a WebSocket at `/ws`.
  Done when: `npm run dev` runs through `server.ts`; a browser with a valid session connects to `/ws`; a connection without a session is refused; live reload still works.
- [ ] **T5.2** Send and read messages.
  Done when: the chat page `/messages/[username]` shows the conversation oldest first; sending saves the message; nobody can read a conversation they are not in.
- [ ] **T5.3** Messages arrive live.
  Done when: with A and B both on their chat page, A's message shows up in B's window without a refresh, and C never receives it.
- [ ] **T5.4** Conversation list `/messages`.
  Done when: it lists everyone I've messaged or who messaged me, newest conversation first, with the last message.

## 6. Notifications
- [ ] **T6.1** Save notifications.
  Done when: following someone or sending them a message creates one notification for them; unfollowing doesn't.
- [ ] **T6.2** Bell and notifications page.
  Done when: the bell shows the unread count; opening `/notifications` lists them newest first and marks them read.
- [ ] **T6.3** Live bell.
  Done when: B's bell count goes up without a refresh when A follows or messages B.
- [ ] **T6.4** Turn on push (browser side).
  Done when: a "Turn on notifications" button asks permission only when clicked, gets a Firebase token and saves it for the user; without Firebase keys the button doesn't show.
- [ ] **T6.5** Send push from the server.
  Done when: a new notification sends a Firebase push to all of that user's tokens; a token Firebase says is dead is deleted; without Firebase keys nothing is sent and the server logs that push is off.

## 7. Ship it
- [ ] **T7.1** The whole app in Docker (`Dockerfile` + `app` service).
  Done when: a fresh clone + `cp .env.example .env` + `docker compose up --build` gives a working app at http://localhost:3000.
- [ ] **T7.2** GitHub Actions runs `npm run check` and `npm run e2e` on every push.
  Done when: the workflow is green on GitHub.
- [ ] **T7.3** README.
  Done when: someone new can start the app, run the tests and set up Firebase by following only the README.

## Found while building
- [x] **F1** T0.3 says "a test can insert a user", but the tests only exist after T0.4. The plan had them in the wrong order.
  Done when: T0.4 is built first and both are committed together.
- [x] **F2** `npm run db:migrate` did nothing: the "run directly" check broke on the space in the folder path.
  Done when: migrations run from a folder whose path has a space.
- [x] **F3** The session check used `new Date()`, and Next.js stopped the page: it won't read the clock while it prerenders.
  Done when: the expiry check uses the database's `now()` and the sign-up browser test lands on the feed.
- [x] **F4** The feed (T2.2) needs to know who I follow, but the follows table was planned for T3.2.
  Done when: the follows table comes with T2.2, and T3.2 only adds the buttons.
- [x] **F5** T3.1 asked for a 404 status, but the profile page streams: the 200 status is sent before the user lookup finishes, and Next.js can't change it later. Next.js adds `noindex` instead.
  Done when: T3.1's Done when says what really happens, and a test checks the noindex tag.
