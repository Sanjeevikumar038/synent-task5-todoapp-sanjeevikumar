# Better To-Do App

**Live Demo:** [https://sanjeevikumar038.github.io/synent-task5-todoapp-sanjeevikumar/](https://sanjeevikumar038.github.io/synent-task5-todoapp-sanjeevikumar/)

A local-first, feature-rich to-do app built with vanilla HTML, CSS, and JavaScript. No frameworks, no backend, no account needed — everything is saved in your browser's localStorage.

---

## Features

### Task Management
- **Add tasks** with a description, due date, priority level, notes, and tags
- **Edit** task text or notes directly from the task card via the Edit / Notes buttons
- **Delete** tasks with a 5-second undo toast so you never lose work by accident
- **Mark tasks complete** using the circular toggle button on each card
- **Mark All Complete** — completes every task in one click
- **Clear All Completed** — appears only when the Completed filter is active

### Completion State
- Each task card has a **circular checkmark toggle** on the left
- Hovering shows a faint green checkmark preview
- Clicking fills the circle solid green and marks the task done
- A **"✓ Completed" badge** appears below the task title
- The entire card gets a **green highlighted background and border** so completed tasks are visually distinct
- The task title gets a strikethrough
- Clicking the toggle again restores the task to active

### Priority Levels
Each task can be assigned one of three priority levels, shown as a colored pill on the card:
- 🔴 **High** — red pill
- 🔵 **Medium** — blue pill (default)
- 🟢 **Low** — green pill

The priority field has a visible **▾ dropdown arrow** so it's clear it has selectable options.

### Due Dates
- Set an optional due date using the **"Due date:"** labeled field in the form
- Due dates are displayed as a purple pill on the task card
- **Overdue tasks** (past due and not completed) are automatically highlighted with a red border and background, and the due pill turns red

### Tags / Categories
- Add comma-separated tags to any task (e.g. `work, personal, urgent`)
- Tags are lowercased and trimmed automatically
- Tags appear as clickable `#tag` pills on each task card
- A **tag filter bar** appears above the task list when any tags exist
- Click any tag pill (on a card or in the filter bar) to instantly filter the list to that tag
- Click **All Tags** to clear the tag filter
- Tag filter state is saved and restored on reload

### Search
- Real-time search bar filters tasks by description as you type
- Composes with status filter, tag filter, and sort — all work together

### Filters
Three status filters for the task list:
- **All** — shows every task
- **Active** — shows only incomplete tasks
- **Completed** — shows only completed tasks, with a "Clear All Completed" button

### Sort Options
Sort the task list using the dropdown in the controls bar:
- **Default** — manual drag-and-drop order
- **Priority** — High → Medium → Low
- **Due Date** — earliest due date first; tasks with no due date go last
- **Created** — newest tasks first

### Drag and Drop
- Drag task cards to reorder them manually
- Reordered position is saved to localStorage

### Export & Import
- **Export Tasks** — downloads all tasks as a `.json` file named `todo-tasks-YYYY-MM-DD.json`
- **Import Tasks** — load tasks from a previously exported JSON file; existing tasks are preserved and imported tasks are appended

The JSON task format:
```json
[
  {
    "id": "uuid",
    "text": "Task description",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "dueDate": "2024-01-15",
    "priority": "high",
    "notes": "Optional notes",
    "tags": ["work", "urgent"]
  }
]
```

### Progress Tracking
- Live summary bar shows total task count and completed count
- Progress chip displays completion percentage (e.g. `75% complete`)

### Dark / Light Theme
- Defaults to dark mode
- Toggle between dark and light with the button in the header
- Theme preference is saved to localStorage

### Sound Feedback
- Subtle audio cues for: add, delete, complete, undo, export, import
- Uses the Web Audio API — no external audio files needed
- Silently skipped in browsers that don't support it

### Accessibility
- All interactive elements have `aria-label` attributes
- Live regions (`aria-live`) for task count and undo toast
- Keyboard-navigable form and controls

### Mobile Responsive
The app is fully responsive across all screen sizes:

| Breakpoint | Behaviour |
|---|---|
| ≤ 720px | Single-column header, stacked form rows, stacked controls, full-width filter buttons and theme toggle |
| ≤ 600px | Due date and priority stack vertically, sort dropdown goes full-width, action buttons stack |
| ≤ 480px | Reduced padding and font sizes throughout, smaller task cards and pills, undo toast stacks vertically |

---

## Project Structure

```
To-do-list/
├── index.html   — App markup and structure
├── script.js    — All app logic (state, rendering, events, localStorage)
└── styles.css   — All styles (dark/light theme, responsive layout, animations)
```

No build step, no dependencies, no `node_modules`.

---

## Getting Started

1. Clone or download the project folder
2. Open `index.html` in any modern browser
3. Start adding tasks — everything saves automatically

```bash
# Or serve locally with any static server, e.g.:
npx serve .
```

---

## localStorage Keys

| Key | What it stores |
|---|---|
| `better-todo-app.tasks` | All task data (JSON array) |
| `better-todo-app.theme` | `"light"` or `"dark"` |
| `better-todo-app.filter` | Active status filter (`all` / `active` / `completed`) |
| `better-todo-app.search` | Last search query |
| `better-todo-app.tagFilter` | Active tag filter |

---

## Browser Support

Works in all modern browsers that support:
- `localStorage`
- `crypto.randomUUID()`
- `Intl.DateTimeFormat`
- CSS `backdrop-filter` (gracefully degrades without it)
