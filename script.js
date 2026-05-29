const STORAGE_KEY = 'better-todo-app.tasks';
const THEME_KEY = 'better-todo-app.theme';
const FILTER_KEY = 'better-todo-app.filter';
const SEARCH_KEY = 'better-todo-app.search';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDue = document.getElementById('task-due');
const taskPriority = document.getElementById('task-priority');
const taskNotes = document.getElementById('task-notes');
const taskSearch = document.getElementById('task-search');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const completedCount = document.getElementById('completed-count');
const clearCompletedButton = document.getElementById('clear-completed');
const markAllCompleteButton = document.getElementById('mark-all-complete');
const exportTasksButton = document.getElementById('export-tasks');
const importTasksButton = document.getElementById('import-tasks');
const importFileInput = document.getElementById('import-file');
const undoToast = document.getElementById('undo-toast');
const undoDeleteButton = document.getElementById('undo-delete');
const progressChip = document.getElementById('progress-chip');
const filterButtons = document.querySelectorAll('.filter-button');
const themeToggle = document.getElementById('theme-toggle');

let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'default';
let lastDeletedTask = null;
let undoTimeoutId = null;
let audioContext = null;

const sortSelect = document.getElementById('sort-tasks');

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

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

function getTaskDueDate() {
  return taskDue?.value || null;
}

function getTaskPriority() {
  return taskPriority?.value || 'medium';
}

function getTaskNotes() {
  return taskNotes?.value.trim();
}

function createTask(text, dueDate = null, priority = 'medium', notes = '') {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
    dueDate,
    priority,
    notes,
  };
}

function addTask(text) {
  if (!text) return;
  tasks.unshift(createTask(text, getTaskDueDate(), getTaskPriority(), getTaskNotes()));
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskDue.value = '';
  if (taskPriority) taskPriority.value = 'medium';
  if (taskNotes) taskNotes.value = '';
  taskInput.focus();
  playSound('add');
}

function deleteTask(id) {
  const taskIndex = tasks.findIndex((task) => task.id === id);
  if (taskIndex === -1) return;
  lastDeletedTask = tasks[taskIndex];
  tasks.splice(taskIndex, 1);
  saveTasks();
  renderTasks();
  showUndoToast();
  playSound('delete');
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
  let visibleTasks = tasks;

  if (currentFilter === 'active') {
    visibleTasks = visibleTasks.filter((task) => !task.completed);
  } else if (currentFilter === 'completed') {
    visibleTasks = visibleTasks.filter((task) => task.completed);
  }

  if (currentSearch.trim()) {
    const query = currentSearch.trim().toLowerCase();
    visibleTasks = visibleTasks.filter((task) => task.text.toLowerCase().includes(query));
  }

  if (currentSort === 'priority') {
    const order = { high: 0, medium: 1, low: 2 };
    visibleTasks = [...visibleTasks].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
  } else if (currentSort === 'due') {
    visibleTasks = [...visibleTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (currentSort === 'created') {
    visibleTasks = [...visibleTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return visibleTasks;
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
      const overdue = isOverdue(task);
      listItem.className = `task-card${task.completed ? ' completed' : ''}${overdue ? ' overdue' : ''}`;
      listItem.dataset.id = task.id;
      listItem.setAttribute('draggable', 'true');

      listItem.innerHTML = `
        <div class="task-card-content">
          <label>
            <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete" />
            <div class="task-text-block">
              <p class="task-title${task.completed ? ' completed' : ''}">${escapeHtml(task.text)}</p>
              <div class="task-meta">
                ${task.dueDate ? `<span class="task-pill due-pill${isOverdue(task) ? ' overdue-pill' : ''}">Due ${formatDueDate(task.dueDate)}</span>` : ''}
                <span class="task-pill priority-pill ${escapeHtml(task.priority)}">${escapeHtml(task.priority)}</span>
                <span>Created ${formatDate(task.createdAt)}</span>
              </div>
              ${task.notes ? `<p class="task-notes">${escapeHtml(task.notes)}</p>` : ''}
            </div>
          </label>
          <div class="task-action">
            <button class="task-button edit-button" aria-label="Edit task">Edit</button>
            <button class="task-button notes-button" aria-label="Edit notes">${task.notes ? 'Notes' : 'Add note'}</button>
            <button class="delete-button" aria-label="Delete task">Delete</button>
          </div>
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
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  taskCount.textContent = `${total} task${total === 1 ? '' : 's'}`;
  completedCount.textContent = `${completed} completed`;
  if (progressChip) progressChip.textContent = `${completionRate}% complete`;
  clearCompletedButton.disabled = completed === 0;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === currentFilter);
  });
}

function saveFilterState() {
  localStorage.setItem(FILTER_KEY, currentFilter);
  localStorage.setItem(SEARCH_KEY, currentSearch);
}

function loadFilterState() {
  const storedFilter = localStorage.getItem(FILTER_KEY);
  const storedSearch = localStorage.getItem(SEARCH_KEY);
  currentFilter = storedFilter || 'all';
  currentSearch = storedSearch || '';

  if (taskSearch) {
    taskSearch.value = currentSearch;
  }

  updateFilterButtons();
}

function formatDueDate(dateString) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

function playSound(type) {
  if (!window.AudioContext) return;
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const frequencies = {
    add: 520,
    delete: 240,
    complete: 420,
    undo: 360,
    export: 560,
    import: 300,
  };

  const duration = 0.08;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequencies[type] || 400;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function showUndoToast() {
  if (!undoToast) return;
  undoToast.classList.remove('hidden');
  clearTimeout(undoTimeoutId);
  undoTimeoutId = setTimeout(hideUndoToast, 5000);
}

function hideUndoToast() {
  if (!undoToast) return;
  undoToast.classList.add('hidden');
  lastDeletedTask = null;
}

function undoDelete() {
  if (!lastDeletedTask) return;
  tasks.unshift(lastDeletedTask);
  lastDeletedTask = null;
  saveTasks();
  renderTasks();
  hideUndoToast();
  playSound('undo');
}

function markAllComplete() {
  tasks = tasks.map((task) => ({ ...task, completed: true }));
  saveTasks();
  renderTasks();
  playSound('complete');
}

function exportTasks() {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `todo-tasks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  playSound('export');
}

function importTasks() {
  if (importFileInput) importFileInput.click();
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const importedTasks = JSON.parse(loadEvent.target.result);
      if (!Array.isArray(importedTasks)) {
        throw new Error('Invalid task format');
      }
      importedTasks.forEach((task) => {
        if (!task?.text) return;
        tasks.push(
          createTask(task.text, task.dueDate, task.priority || 'medium', task.notes || ''),
        );
        const addedTask = tasks[tasks.length - 1];
        addedTask.completed = !!task.completed;
        addedTask.createdAt = task.createdAt || new Date().toISOString();
      });
      saveTasks();
      renderTasks();
      playSound('import');
    } catch (error) {
      alert('Unable to import tasks. Please select a valid JSON file.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  const updatedText = window.prompt('Edit task description', task.text);
  if (updatedText === null) return;
  const trimmedText = updatedText.trim();
  if (!trimmedText) return;
  task.text = trimmedText;
  saveTasks();
  renderTasks();
  playSound('add');
}

function editNotes(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  const updatedNotes = window.prompt('Edit notes or subtasks', task.notes || '');
  if (updatedNotes === null) return;
  task.notes = updatedNotes.trim();
  saveTasks();
  renderTasks();
  playSound('add');
}

function reorderTasks(sourceId, targetId) {
  const sourceIndex = tasks.findIndex((task) => task.id === sourceId);
  const targetIndex = tasks.findIndex((task) => task.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;
  const [movedTask] = tasks.splice(sourceIndex, 1);
  tasks.splice(targetIndex, 0, movedTask);
  saveTasks();
  renderTasks();
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

  if (event.target.closest('.edit-button')) {
    editTask(taskId);
    return;
  }

  if (event.target.closest('.notes-button')) {
    editNotes(taskId);
    return;
  }

  if (event.target.closest('.delete-button')) {
    deleteTask(taskId);
  }
});

taskList.addEventListener('dragstart', (event) => {
  const taskCard = event.target.closest('.task-card');
  if (!taskCard) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', taskCard.dataset.id);
  taskCard.classList.add('dragging');
});

taskList.addEventListener('dragend', (event) => {
  const taskCard = event.target.closest('.task-card');
  if (!taskCard) return;
  taskCard.classList.remove('dragging');
});

taskList.addEventListener('dragover', (event) => {
  event.preventDefault();
  const taskCard = event.target.closest('.task-card');
  if (!taskCard) return;
  taskCard.classList.add('drag-over');
});

taskList.addEventListener('dragleave', (event) => {
  const taskCard = event.target.closest('.task-card');
  if (!taskCard) return;
  taskCard.classList.remove('drag-over');
});

taskList.addEventListener('drop', (event) => {
  event.preventDefault();
  const sourceId = event.dataTransfer.getData('text/plain');
  const taskCard = event.target.closest('.task-card');
  if (!taskCard || !sourceId) return;
  const targetId = taskCard.dataset.id;
  taskList.querySelectorAll('.task-card').forEach((card) => card.classList.remove('drag-over'));
  reorderTasks(sourceId, targetId);
});

if (sortSelect) {
  sortSelect.value = currentSort;
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    renderTasks();
  });
}

clearCompletedButton.addEventListener('click', clearCompletedTasks);
if (markAllCompleteButton) {
  markAllCompleteButton.addEventListener('click', markAllComplete);
}
if (exportTasksButton) {
  exportTasksButton.addEventListener('click', exportTasks);
}
if (importTasksButton) {
  importTasksButton.addEventListener('click', importTasks);
}
if (importFileInput) {
  importFileInput.addEventListener('change', handleImportFile);
}
if (undoDeleteButton) {
  undoDeleteButton.addEventListener('click', undoDelete);
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    saveFilterState();
    renderTasks();
  });
});

if (taskSearch) {
  taskSearch.addEventListener('input', (event) => {
    currentSearch = event.target.value;
    saveFilterState();
    renderTasks();
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

window.addEventListener('beforeunload', saveTasks);

loadTheme();
loadFilterState();
loadTasks();
renderTasks();
