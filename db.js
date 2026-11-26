// db.js - the database layer
// We use SQLite (a real SQL database stored in one file: tasks.db).
// This file is the ONLY place that talks to the database.
// The rest of the app calls the small functions exported at the bottom.

const Database = require("better-sqlite3");
const path = require("path");

// Open (or create) the database file next to this file
const db = new Database(path.join(__dirname, "tasks.db"));

// WAL mode = safer reads/writes when several requests arrive together
db.pragma("journal_mode = WAL");

// Create the table on first run (IF NOT EXISTS = safe to run every start)
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    category   TEXT    NOT NULL DEFAULT 'General',
    due_date   TEXT,                       -- stored as YYYY-MM-DD (or NULL)
    completed  INTEGER NOT NULL DEFAULT 0, -- SQLite has no boolean: 0 = false, 1 = true
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Prepare the SQL statements once (faster + protected from SQL injection)
const insertTask = db.prepare(
  "INSERT INTO tasks (title, category, due_date) VALUES (?, ?, ?)"
);
const selectAll = db.prepare("SELECT * FROM tasks ORDER BY completed, due_date IS NULL, due_date, id DESC");
const selectByDone = db.prepare("SELECT * FROM tasks WHERE completed = ? ORDER BY due_date IS NULL, due_date, id DESC");
const selectOne = db.prepare("SELECT * FROM tasks WHERE id = ?");
const updateTask = db.prepare(
  "UPDATE tasks SET title = ?, category = ?, due_date = ?, completed = ? WHERE id = ?"
);
const deleteTask = db.prepare("DELETE FROM tasks WHERE id = ?");
const countAll = db.prepare("SELECT COUNT(*) AS n FROM tasks");

// ---- functions the server uses ----

function getAllTasks() {
  return selectAll.all();
}

function getTasks(completed) {
  return selectByDone.all(completed ? 1 : 0);
}

function getTask(id) {
  return selectOne.get(id);
}

function createTask({ title, category, dueDate }) {
  const info = insertTask.run(title, category || "General", dueDate || null);
  return selectOne.get(info.lastInsertRowid); // return the new row
}

function updateTaskFull(id, { title, category, dueDate, completed }) {
  updateTask.run(title, category || "General", dueDate || null, completed ? 1 : 0, id);
  return selectOne.get(id);
}

function removeTask(id) {
  return deleteTask.run(id).changes > 0; // true if a row was deleted
}

// On a brand-new database, add 3 example tasks so the app is not empty
if (countAll.get().n === 0) {
  createTask({ title: "Learn how this app works", category: "Study", dueDate: null });
  createTask({ title: "Build my portfolio projects", category: "Work", dueDate: null });
  createTask({ title: "Buy groceries", category: "Personal", dueDate: null });
}

module.exports = { getAllTasks, getTasks, getTask, createTask, updateTaskFull, removeTask };
