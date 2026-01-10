# MetHere

MetHere is a modern contact/venue tracker with a glassmorphism-inspired UI. You can organize people by venue, apply tags, search/filter across names & tags, and track achievements as you add more data.

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
- **Proximity alerts** – `src/utils/proximityService.ts` registers a background geolocation watcher (Capacitor + community plugin) and posts local notifications when you’re within ~100 m of a venue that has a saved pin. The app must stay running (foreground or background); iOS clears geofences if the app is force-quit. The global toggle in Settings controls the watcher and is disabled on web by default.
- When testing native features run `npm run ios:sync` after installing deps so Capacitor picks up the plugins, and ensure iOS location + notification permissions are granted.

## Styling Philosophy
- Glass outer shells (cards, modals) with flat/tinted inner cards to avoid stacked shadows.
- Tag and venue chips reflect app colors; most-used tags/venues appear first.

## Permissions & Alerts
- `Info.plist` strings are tuned for App Store review:
  - **Always + When In Use:** “MetHere uses your location to tag venues and alert you when you’re nearby.”
  - **When In Use:** “Allow location access so you can pin venues and people while using MetHere.”
  - **Notifications:** “We send gentle alerts when you’re close to your saved venues.”
- `LocationSection` centralizes geolocation + MapKit logic and shows friendly toasts if permissions are denied so users know to re-enable access later.

## Native Build & TestFlight
1. Install deps and sync Capacitor:
   ```bash
   npm install
   npx cap sync ios
   ```
2. Open `ios/App/App.xcworkspace` in Xcode, confirm the bundle ID + marketing version, and run the **Release** scheme on a device to smoke-test proximity alerts (leave the app in the background), haptics, achievements, and add/edit flows.
3. Archive via Product ▸ Archive and upload from the Organizer to TestFlight (Apple IDs need App Store Connect access).

## Release Checklist
- [ ] `npm run build` + quick `npm run dev` smoke test.
- [ ] Device QA: add/edit person, capture location, toggle proximity, earn an achievement, flip the haptics toggle.
- [ ] Ensure “Reset sample data” / “Clear achievements” are hidden or gated for external testers if needed.
- [ ] Verify the Info.plist permission copy and on-device prompts look correct.
- [ ] Spot-check Firebase analytics (search, theme switch, person add/update, proximity events) in the Firebase console after a session.
