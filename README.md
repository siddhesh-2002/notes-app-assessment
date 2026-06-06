# NoteVault — React Note Management System

A modern, production-quality note management app built with React 18 + Vite.

## Features

- **Create / Edit / Delete** notes with validation
- **Real-time search** across title and content
- **Dark / Light mode** toggle, persisted in localStorage
- **Category filter** (General, Work, Personal, Ideas, Todo, Learning)
- **Sort** by newest, oldest, A–Z, Z–A
- **Character & word counter** in the editor
- **Toast notifications** for all actions
- **Responsive** — mobile, tablet, desktop
- **localStorage** persistence — no backend needed

## Tech Stack

| Layer        | Tech                          |
|--------------|-------------------------------|
| Framework    | React 18 (functional + hooks) |
| Build tool   | Vite 5                        |
| Styling      | CSS Modules + CSS variables   |
| State        | useState, useMemo, useContext |
| Persistence  | Custom useLocalStorage hook   |
| Fonts        | Syne (headings) + DM Sans     |

## Project structure

```
notevault/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Root component + all state
    ├── App.module.css        # Page-level layout styles
    ├── index.css             # Global styles + design tokens
    │
    ├── context/
    │   └── ThemeContext.jsx   # Dark/light mode context + hook
    │
    ├── hooks/
    │   └── useLocalStorage.js # Persistent state hook
    │
    └── components/
        ├── Header.jsx         # Sticky navbar with search
        ├── Header.module.css
        ├── NoteCard.jsx       # Note card with edit/delete
        ├── NoteCard.module.css
        ├── NoteForm.jsx       # Create / edit modal form
        ├── NoteForm.module.css
        ├── DeleteConfirm.jsx  # Deletion confirmation modal
        ├── DeleteConfirm.module.css
        ├── Toast.jsx          # Toast notification system
        └── Toast.module.css
```

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Key patterns explained

### useLocalStorage hook
Wraps `useState` so the value is automatically synced to `localStorage`:
```js
const [notes, setNotes] = useLocalStorage('notevault_notes', [])
```

### ThemeContext
Uses React Context + `useLocalStorage` to persist the user's theme preference.
The `data-theme` attribute on `<html>` switches between CSS variable sets:
```jsx
document.documentElement.setAttribute('data-theme', theme)
```

### CSS Modules
Every component has its own `.module.css` file. Classes are locally scoped,
so there are no naming collisions between components.

### CSS Variables for theming
All colors are defined as CSS variables in two blocks:
```css
[data-theme='light'] { --bg-base: #ffffff; --text-primary: #16131f; ... }
[data-theme='dark']  { --bg-base: #18152a; --text-primary: #f0eeff; ... }
```

Components never hardcode colors — they reference variables, so dark mode
"just works" without any conditional logic in JS.
