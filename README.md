# TaskFlow

A full-stack task manager: vanilla HTML/CSS/JS frontend, Node + Express backend, and a real SQLite database.

## Run it locally

```bash
npm install
npm start
```

Then open http://localhost:3000

## How it is organized

| File               | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `server.js`        | Entry point: serves the frontend + the `/api/tasks` API   |
| `db.js`            | The only file that talks to the SQLite database (`tasks.db`) |
| `public/index.html`| Page structure                                            |
| `public/style.css` | All the design                                            |
| `public/script.js` | Page logic: calls the API with `fetch()` and draws the tasks |

## API

| Method | Path                      | Purpose                     |
| ------ | ------------------------- | --------------------------- |
| GET    | `/api/tasks?filter=all`   | List tasks (all/active/completed) |
| POST   | `/api/tasks`              | Create a task               |
| PATCH  | `/api/tasks/:id`          | Update title/category/due/completed |
| DELETE | `/api/tasks/:id`          | Delete a task               |

## Deploy on Render

1. Push this repo to GitHub.
2. On render.com: New -> Web Service -> pick this repo.
3. Build command: `npm install` - Start command: `npm start` - Free plan.
4. Render gives you a live URL.

Note: on the free plan the app sleeps when idle (first visit can take ~1 minute to wake up), and the database file resets when the app redeploys.
