const STORAGE_KEY = 'better-todo-app.tasks';
const THEME_KEY = 'better-todo-app.theme';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const completedCount = document.getElementById('completed-count');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-button');
const themeToggle = document.getElementById('theme-toggle');

let tasks = [];
let currentFilter = 'all';

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getTaskText() {
  return taskInput.value.trim();
}

function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

function addTask(text) {
  if (!text) return;
  tasks.unshift(createTask(text));
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function toggleTaskCompleted(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((task) => !task.completed);
  }
  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function formatDate(isoString) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoString));
}

function renderTasks() {
  const visibleTasks = getFilteredTasks();
  taskList.innerHTML = '';

  if (visibleTasks.length === 0) {
    taskList.innerHTML = `<li class="task-card empty-state">No tasks yet. Add your first one above.</li>`;
  } else {
    visibleTasks.forEach((task) => {
      const listItem = document.createElement('li');
      listItem.className = `task-card${task.completed ? ' completed' : ''}`;
      listItem.dataset.id = task.id;

      listItem.innerHTML = `
        <label>
          <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete" />
          <div class="task-content">
            <p class="task-title${task.completed ? ' completed' : ''}">${escapeHtml(task.text)}</p>
            <div class="task-meta">Created ${formatDate(task.createdAt)}</div>
          </div>
        </label>
        <div class="task-action">
          <button class="delete-button" aria-label="Delete task">Delete</button>
        </div>
      `;

      taskList.appendChild(listItem);
    });
  }

  updateSummary();
  updateFilterButtons();
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  taskCount.textContent = `${total} task${total === 1 ? '' : 's'}`;
  completedCount.textContent = `${completed} completed`;
  clearCompletedButton.disabled = completed === 0;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);
  if (themeToggle) {
    themeToggle.textContent = isLight ? 'Dark mode' : 'Light mode';
    themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
  }
}

function loadTheme() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(storedTheme === 'light' ? 'light' : 'dark');
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light') ? 'dark' : 'light';
  saveTheme(nextTheme);
  applyTheme(nextTheme);
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(getTaskText());
});

taskList.addEventListener('click', (event) => {
  const taskCard = event.target.closest('.task-card');
  if (!taskCard) return;
  const taskId = taskCard.dataset.id;

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTaskCompleted(taskId);
    return;
  }

  if (event.target.closest('.delete-button')) {
    deleteTask(taskId);
  }
});

clearCompletedButton.addEventListener('click', clearCompletedTasks);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

window.addEventListener('beforeunload', saveTasks);

loadTheme();
loadTasks();
renderTasks();
