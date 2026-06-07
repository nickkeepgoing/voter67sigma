# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR (Vite)
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint across all files
```

No test suite is configured.

## Architecture

**67Sigma** is a Class Battle Royale — a single-page tournament app where classmates compete in 1v1 brackets across fun voting categories. It is a **client-only** app with no backend.

### Key files

| File | Role |
|------|------|
| `src/main.jsx` | React entry point (StrictMode) |
| `src/App.jsx` | Entire application (~470 lines) — all state, logic, and screens |
| `src/index.css` | All styles and the CSS design-token variables |

### App.jsx structure

All logic lives in a single `App` component using `useState`/`useEffect`:

- **Screens**: topic selection → voting bracket → results (toggled via `currentScreen` state)
- **Tournament engine**: 16-participant single-elimination bracket (Round of 16 → QF → SF → Final), reshuffled each run
- **Persistence**: `localStorage` key `classroom_ranking_db` stores cumulative win counts, championship counts, and total runs per participant — no remote API
- **Confetti**: Canvas 2D particle system triggered on tournament completion, cleaned up via `useEffect` return

### Design system

CSS variables are defined in `index.css`:
- Dark backgrounds: `--bg-dark` (#070913), `--bg-darker` (#04050a)
- Primary: indigo (`--primary` #6366f1 / `--primary-light` #818cf8)
- Accent: gold (`--accent` #fbbf24)
- Fonts: Outfit (headings) + Inter (body) loaded from Google Fonts in `index.html`
- Glassmorphism via `backdrop-filter: blur`
- Mobile breakpoint: 600px

### Avatars

Participant avatars are procedurally generated inline SVGs. Color hue is derived from the character-code sum of the participant's name, making each avatar deterministic and consistent across renders.

## Stack

- React 19 + Vite 8 (JavaScript/JSX, no TypeScript)
- `lucide-react` for icons
- No state management library; plain React hooks only
- No router; screen switching is done via state
