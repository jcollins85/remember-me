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

## Mobile-only niceties
- **Haptics** – centralised in `src/utils/haptics.ts`, with a Settings toggle that writes to `localStorage`.
- **Proximity alerts** – `src/utils/proximityService.ts` registers a background geolocation watcher (Capacitor + community plugin) and posts local notifications when you’re within ~100 m of a venue that has a saved pin. The global toggle in Settings controls the watcher and is disabled on web by default.
- When testing native features run `npm run ios:sync` after installing deps so Capacitor picks up the plugins, and ensure iOS location + notification permissions are granted.

## Styling Philosophy
- Glass outer shells (cards, modals) with flat/tinted inner cards to avoid stacked shadows.
- Tag and venue chips reflect app colors; most-used tags/venues appear first.
