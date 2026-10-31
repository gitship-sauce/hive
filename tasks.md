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
- [x] **T3.2** Follow and unfollow.
  Done when: Follow adds one row and the counts go up; Unfollow removes it; following twice still gives one row; you can't follow yourself.

## 4. Search
- [x] **T4.1** Search users.
  Done when: typing part of a username lists matching users (case doesn't matter, up to 20); symbols like `%` and `_` are searched as plain text.

## 5. Messages (live)
- [x] **T5.1** Our own server with a WebSocket at `/ws`.
  Done when: `npm run dev` runs through `server.ts`; a browser with a valid session connects to `/ws`; a connection without a session is refused; live reload still works.
- [x] **T5.2** Send and read messages.
  Done when: the chat page `/messages/[username]` shows the conversation oldest first; sending saves the message; nobody can read a conversation they are not in.
- [x] **T5.3** Messages arrive live.
  Done when: with A and B both on their chat page, A's message shows up in B's window without a refresh, and C never receives it.
- [x] **T5.4** Conversation list `/messages`.
  Done when: it lists everyone I've messaged or who messaged me, newest conversation first, with the last message.

## 6. Notifications
- [x] **T6.1** Save notifications.
  Done when: following someone or sending them a message creates one notification for them; unfollowing doesn't.
- [x] **T6.2** Bell and notifications page.
  Done when: the bell shows the unread count; opening `/notifications` lists them newest first and marks them read.
- [x] **T6.3** Live bell.
  Done when: B's bell count goes up without a refresh when A follows or messages B.
- [x] **T6.4** Turn on push (browser side).
  Done when: a "Turn on notifications" button asks permission only when clicked, gets a Firebase Installation ID and saves it for this login; without Firebase keys the button doesn't show.
- [x] **T6.5** Send push from the server.
  Done when: a new notification sends a Firebase push to all of that user's browsers; an installation ID Firebase says is gone is deleted; without Firebase keys nothing is sent and the server logs that push is off.

## 7. Ship it
- [x] **T7.1** The whole app in Docker (`Dockerfile` + `app` service).
  Done when: a fresh clone + `cp .env.example .env` + `docker compose up --build` gives a working app at http://localhost:3000.
- [x] **T7.2** ~~GitHub Actions runs `npm run check` and `npm run e2e` on every push.~~
  Dropped: everything runs locally (`npm run check`, `npm run e2e`, `docker compose up --build`).
- [x] **T7.3** README.
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
- [x] **F6** `npm run typecheck` failed on a fresh copy: the page types (`PageProps`) only exist after `next dev` has run once.
  Done when: typecheck runs `next typegen` first.
- [x] **F7** The search browser test hung: Next.js keeps the page you came from in the page, hidden, so "Username" matched the sign-up box too.
  Done when: the search box has its own label and the test finds it by role, which skips hidden elements.
- [x] **F8** After the WebSocket provider was added, 4 older browser tests failed now and then: while a page streams in, React keeps the new part in a hidden copy for a moment, and test-id and text lookups also match hidden elements.
  Done when: those lookups only match visible elements, and the whole browser suite passes 3 runs in a row.
- [x] **F9** A message sent while the other person's socket was still connecting, or had dropped, never showed up until they reloaded.
  Done when: after every (re)connect the chat loads the conversation again, and a test that cuts B's connection sees the missed message appear.
- [x] **F10** A message browser test clicked the header's "Messages" link instead of the profile's "Message" button: role names match parts of words unless told to match exactly ("Follow" also matched "Unfollow").
  Done when: every role lookup in the browser tests is exact, and the suite passes 3 runs in a row.
- [x] **F11** The plan said Firebase "tokens", but Firebase now marks registration tokens deprecated and recommends Firebase Installation IDs (`register()` + `onRegistered()` in the browser, `fid` on the server).
  Done when: the app uses installation IDs, and PLAN.md and T6.4/T6.5 say so.
- [x] **F12** `npm audit` found 4 high issues through the `firebase` package, which brings Firestore and gRPC we never use.
  Done when: only `@firebase/app` and `@firebase/messaging` are installed and `npm audit --omit=dev` finds 0.
- [x] **F13** T6.4 and T6.5 are checked with a fake Firebase. Check them once with a real Firebase project.
  Done when: with B's tab closed, A follows B and B's computer shows the push; clicking it opens A's profile.

### From an independent code review (a fresh Claude, given only the code)
- [x] **F14** A browser that disconnected while `/ws` was checking its session crashed the whole server: the raw socket had no error listener during the database lookup.
  Done when: a test resets the connection mid-check and the server keeps working (without the fix, the run fails with ECONNRESET).
- [x] **F15** If saving the notification failed, "send message" and "follow" showed an error even though they had worked, so people would retry and send twice.
  Done when: notify() logs the error and never throws, and logged-in pages have an error page instead of a crash.
- [x] **F16** Sending a too-long message showed the error but wiped what you typed (React clears a form after its action).
  Done when: a browser test sends 1001 characters and the text is still in the box.
- [x] **F17** WebSocket requests to any path except `/ws` were never answered and stayed open forever.
  Done when: they get 404; in development `/_next/` is still left to Next.js's live reload.
- [x] **F18** `/u/%25` gave a server error: the page decoded the address a second time.
  Done when: odd characters in the address show "User not found".
- [x] **F19** In Docker the server runs as `node`, but `.next` belonged to root, so the server couldn't write its cache.
  Done when: `.next` is owned by `node` in the image and a write works.
- [x] **F20** After a too-long post failed, the counter said 0 while the text was still there.
  Done when: a browser test sees "281/280" next to the restored text.
- [x] **F21** If Firebase changed a browser's installation ID later and saving it failed, nothing was logged or shown.
  Done when: later failures are logged and the button shows the error state.
- [x] **F22** The follow action used a true/false sent by the browser without checking it.
  Done when: it is checked with zod like every other input.
- [x] **F23** `npm run dev` listened on every network interface, not only this computer.
  Done when: the server listens on HOSTNAME (localhost unless set; Docker sets 0.0.0.0).

### From the real Firebase check
- [x] **F24** In a browser whose push service never answers (Brave with Google push off, Chromium test builds), "Turn on notifications" spun on "Turning on…" forever with no error.
  Done when: after 20 seconds it says the push service didn't answer and names the Brave setting (checked in Chromium for Testing against the real Firebase project).
- [x] **F25** In Brave with Google push off, Firebase failed at once with "AbortError: Registration failed - push service error", and the page showed only "Couldn't turn on".
  Done when: that error shows the same Brave help as F24. Real check: after turning the setting on and restarting Brave, the pop-up arrived with the tab closed.
