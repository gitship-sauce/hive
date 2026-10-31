# Plan: a very basic social app

## What we want

A small social app that runs on your own laptop. Anyone can clone it and start it with one command.

1. **Sign up and log in** with a username and password.
2. **Post and feed.** Write a short text post (up to 280 characters). The home feed shows your posts and the posts of people you follow, newest first.
3. **Profile, follow and unfollow.** Every user has a page with their posts and follower and following counts. You can follow or unfollow them there.
4. **Search** for users by username.
5. **Messages.** One-to-one chat. A new message appears in the other person's open window without a refresh.
6. **Notifications.** "X followed you" and "X sent you a message". A bell shows the unread count and updates live. If you turned on push, you also get a system notification when the tab is closed.

**Not now:** likes, comments, pictures, editing or deleting posts, typing indicators, online status, putting it on the internet.

## How we build it

| Part | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router) + TypeScript + Tailwind | Pages and server code in one project |
| Database | PostgreSQL 18 in Docker | The same database everywhere; nothing to install except Docker |
| Database code | Drizzle ORM + `pg` | Tables written in TypeScript, queries that read like SQL, no generated code |
| Login | bcrypt password hash + a session row in the database + an httpOnly cookie | No outside service |
| Live messages and bell | WebSocket (`ws`) on our own server at `/ws` | The server can send to an open page the moment something happens |
| Push when the tab is closed | Firebase Cloud Messaging (free) | A WebSocket closes with the tab; the browser's push service doesn't |
| Checking inputs | zod | Every form and API checks its input before it touches the database |
| Tests | Vitest (server code against a real test database) + Playwright (two users in two browsers) | Each task's "Done when" becomes a test |

Firebase is optional. Without its keys, everything works except the system pop-up.

## Data

- **users:** id, username (unique, 3–20 of a–z, 0–9, _), password hash, created at
- **sessions:** id (hash of the cookie token), user id, expires at
- **posts:** id, author id, body (1–280), created at
- **follows:** follower id, following id, created at. One row per pair, and you can't follow yourself.
- **messages:** id, sender id, recipient id, body (1–1000), created at
- **notifications:** id, user id (who gets it), type (follow or message), actor id (who did it), message id, created at, read at
- **push_registrations:** Firebase Installation ID, user id, session id (log out removes it), created at

## Pages

`/` feed · `/signup` · `/login` · `/u/[username]` profile · `/search` · `/messages` · `/messages/[username]` chat · `/notifications`

## How we work

- The work is split into small tasks in `tasks.md`, each with a **Done when** line.
- Claude does one task at a time: plan → code → test from "Done when" → run all tests → tick → one commit.
- Bugs found along the way become new tasks in "Found while building".
