# Quest Board — Kids Task & Time Management App

A local web app for tracking kids' goals and tasks, visualized as a winding
quest trail, with a points-based reward system.

## What's included

- **Kid profile cards** (`/`) — photo, name, age; tap a card to open that kid's trail.
- **Quest trail / progress page** (`/kid/:id`) — the kid's avatar sits on a winding
  path, each goal is a station along it, and the checklist below shows the tasks
  inside each goal plus the rewards shelf.
- **Admin dashboard** (`/admin`, login required) — add/edit/delete kids (with photo
  upload), create goals and tasks per kid, mark tasks done (which awards points),
  and manage the rewards catalog + redeem points for a kid.
- **SQLite** storage (`backend/data.sqlite3`, created automatically on first run).
- **Points-based rewards** — every task has a point value; completing it credits
  the kid's balance; an admin redeems a reward (e.g. chocolate, extra screen time)
  which deducts points and logs the redemption.

## Project structure

```
kids-task-app/
  backend/     Express API + SQLite (better-sqlite3)
  frontend/    React app (Vite)
```

## Running it locally

You need Node.js 18+ installed.

**1. Start the backend**

```bash
cd backend
npm install
npm start
```

This runs the API on `http://localhost:4000` and creates `data.sqlite3` plus a
default admin account on first run:

```
username: admin
password: admin123
```

Change this password by editing the `admin_users` table directly (or add your
own admin user and delete the seeded one) before giving anyone else access.

**2. Start the frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server
proxies `/api` and `/uploads` requests to the backend on port 4000, so both
need to be running.

**3. First-time setup**

1. Go to **Parent / Admin** (top right) and log in with the default credentials above.
2. Add a kid (photo optional).
3. Switch to **Goals & Tasks**, pick that kid, add a goal, then add a few tasks
   under it with point values.
4. Switch to **Rewards & Redeem** and add a couple of rewards (e.g. 🍫 Chocolate
   treat — 20 pts, 📱 30 min screen time — 30 pts).
5. Go back to the home page, click the kid's card, and you'll see their trail —
   mark tasks done from the admin Goals tab and watch the avatar move and the
   points balance grow.

## Building for production

```bash
cd frontend
npm run build
```

This outputs static files to `frontend/dist`. Serve them with any static file
server, and point that server (or a reverse proxy) at the backend for `/api`
and `/uploads` the same way the dev proxy does — or serve `dist` directly from
the Express app by adding `express.static('../frontend/dist')` in `server.js`.

## Notes / next steps you may want

- Admin auth is a single shared login — there's no per-parent account system.
- Kid photos are stored on disk under `backend/uploads/`.
- Reward redemption currently requires the admin panel (kids don't self-serve),
  so a parent always approves the trade.
