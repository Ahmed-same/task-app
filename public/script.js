// script.js - everything the page does in the browser
// The page never stores data itself: it asks the backend (/api/tasks)
// and the backend talks to the SQLite database.

// ---------- small helpers ----------

// call the API and parse the JSON reply (throws on server errors)
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null; // delete replies with no body
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// escape user text before putting it in HTML (security: prevents XSS)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(iso) {
  // "2026-11-30" -> "Nov 30"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isLate(task) {
  if (!task.due_date || task.completed) return false;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return task.due_date < today;
}

// ---------- state ----------

let currentFilter = "all"; // all | active | completed

// elements we use a lot
const listEl = document.getElementById("task-list");
const emptyEl = document.getElementById("empty-msg");
const errorEl = document.getElementById("error-msg");
const countActiveEl = document.getElementById("count-active");
const countCompletedEl = document.getElementById("count-completed");

// ---------- rendering ----------

function taskElement(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.completed ? " done" : "");
  li.dataset.id = task.id;

  li.innerHTML = `
    <button class="check" title="Mark done"></button>
    <span class="title">${escapeHtml(task.title)}</span>
    <span class="chip">${escapeHtml(task.category)}</span>
    ${task.due_date ? `<span class="due ${isLate(task) ? "late" : ""}">${formatDate(task.due_date)}</span>` : ""}
    <button class="icon-btn edit"   title="Edit">&#9998;</button>
    <button class="icon-btn delete" title="Delete">&#128465;</button>
  `;

  // toggle done
  li.querySelector(".check").addEventListener("click", () =>
    updateTask(task.id, { completed: !task.completed })
  );

  // delete
  li.querySelector(".delete").addEventListener("click", () => deleteTask(task.id));

  // edit: swap the title text for an input, save on Enter / blur
  li.querySelector(".edit").addEventListener("click", () => startEdit(li, task));

  return li;
}

function startEdit(li, task) {
  const titleEl = li.querySelector(".title");
  const input = document.createElement("input");
  input.className = "edit-input";
  input.value = task.title;
  input.maxLength = 200;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  let saved = false;
  async function save() {
    if (saved) return; // blur fires after Enter too
    saved = true;
    const title = input.value.trim();
    if (title && title !== task.title) {
      await updateTask(task.id, { title });
    } else {
      render(); // nothing changed, just redraw
    }
  }
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") { saved = true; render(); }
  });
  input.addEventListener("blur", save);
}

async function render() {
  try {
    const tasks = await api(`/api/tasks?filter=${currentFilter}`);
    listEl.innerHTML = "";
    tasks.forEach((t) => listEl.appendChild(taskElement(t)));
    emptyEl.hidden = tasks.length > 0;
    updateCounts();
    errorEl.hidden = true;
  } catch (err) {
    showError(err.message);
  }
}

async function updateCounts() {
  try {
    const all = await api("/api/tasks");
    const active = all.filter((t) => !t.completed).length;
    countActiveEl.textContent = `${active} active`;
    countCompletedEl.textContent = `${all.length - active} completed`;
  } catch {
    // counts are not critical, ignore errors here
  }
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

// ---------- actions ----------

async function addTask(event) {
  event.preventDefault(); // stop the form from reloading the page
  const title = document.getElementById("title-input").value.trim();
  const category = document.getElementById("category-input").value;
  const dueDate = document.getElementById("due-input").value || null;
  if (!title) return;

  try {
    await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title, category, dueDate }),
    });
    document.getElementById("add-form").reset();
    render();
  } catch (err) {
    showError(err.message);
  }
}

async function updateTask(id, changes) {
  try {
    await api(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    render();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteTask(id) {
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    render();
  } catch (err) {
    showError(err.message);
  }
}

// ---------- wire everything up ----------

document.getElementById("add-form").addEventListener("submit", addTask);

// filter buttons in the top bar
document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    render();
  });
});

// start on "All"
document.querySelector('[data-filter="all"]').classList.add("active");
render();
