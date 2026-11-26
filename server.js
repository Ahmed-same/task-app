// server.js - the entry point of the backend
// Two jobs:
//   1. Serve the frontend files (the "public" folder)
//   2. Provide a small JSON API under /api/tasks that talks to the database

const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000; // Render sets PORT; locally we use 3000

app.use(express.json()); // lets us read JSON from request bodies
app.use(express.static(path.join(__dirname, "public"))); // index.html, style.css, script.js

// ---------- API routes ----------

// GET /api/tasks?filter=all|active|completed  -> list of tasks
app.get("/api/tasks", (req, res) => {
  const filter = req.query.filter || "all";
  if (filter === "active") return res.json(db.getTasks(false));
  if (filter === "completed") return res.json(db.getTasks(true));
  res.json(db.getAllTasks());
});

// POST /api/tasks  { title, category, dueDate }  -> the created task
app.post("/api/tasks", (req, res) => {
  const { title, category, dueDate } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (title.trim().length > 200) {
    return res.status(400).json({ error: "Title is too long (max 200 characters)" });
  }
  const task = db.createTask({
    title: title.trim(),
    category: (category || "General").trim().slice(0, 30),
    dueDate: dueDate || null,
  });
  res.status(201).json(task); // 201 = created
});

// PATCH /api/tasks/:id  { title?, category?, dueDate?, completed? }  -> the updated task
app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.getTask(id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const body = req.body || {};
  if (body.title !== undefined && !String(body.title).trim()) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  // keep old values for any field the client did not send
  const task = db.updateTaskFull(id, {
    title: body.title !== undefined ? String(body.title).trim().slice(0, 200) : existing.title,
    category: body.category !== undefined ? String(body.category).trim().slice(0, 30) : existing.category,
    dueDate: body.dueDate !== undefined ? body.dueDate || null : existing.due_date,
    completed: body.completed !== undefined ? Boolean(body.completed) : Boolean(existing.completed),
  });
  res.json(task);
});

// DELETE /api/tasks/:id  -> 204 (no content) on success
app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!db.removeTask(id)) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`TaskFlow running at http://localhost:${PORT}`);
});
