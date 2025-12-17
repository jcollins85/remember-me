# Remember Me

A modern contact/venue tracker with a glassmorphism-inspired UI. You can organize people by venue, apply tags, search/filter across names & tags, and track achievements as you add more data.

## Tech Stack
- **React + Vite** for the UI.
- **Tailwind CSS** for styling, tuned with design tokens.
- **Framer Motion** for section/card animations.
- **Context + custom hooks** (People/Tags/Venues, achievements, data backup) for state.
## Running Locally
```bash
npm install
npm run dev
```
Visit `http://localhost:5173` in your browser.

## Data & Persistence
- People/venues/tags are stored in `localStorage` via the context hooks.
- “Reset sample data” and “Clear achievements” live in Settings for a fresh slate.
- Import/export backups via JSON in Settings (sanitization + rollback safeguards).

## Key Components
- `App.tsx` – orchestrates contexts, headers, sections, and panels.
- `components/header` – search, sort toggles, segmented control.
- `components/venues` – glass venue cards + flattened person cards.
- `components/profile/ProfilePanel.tsx` – profile dashboard (stats, usage insights, achievements).
- `components/settings/SettingsPanel.tsx` – themes, data tools, backup controls.
- `hooks/useAchievements.ts`, `hooks/useDataBackup.ts`, `hooks/useFilteredSortedPeople.ts` – core logic.

## Notifications
- Toasts are handled by `NotificationContext`: stacked, dismissible, and theme-aware. We persist the last 25 events so panels like Profile can still show history even after reloads.

## Styling Philosophy
- Glass outer shells (cards, modals) with flat/tinted inner cards to avoid stacked shadows.
- Tag and venue chips reflect app colors; most-used tags/venues appear first.
