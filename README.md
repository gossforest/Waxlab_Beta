# WaxLab

A progressive web app for Nordic ski wax technicians. WaxLab tracks glide and kick wax testing across a full race season — head-to-head ski tournaments, glide-out comparisons, conditions logging, team collaboration, and a cross-season product database that gets smarter over time.

Built for race-day use on phones and tablets. Works offline. Syncs across devices in real time.

---

## What it does

**Testing workflow**

- Events contain Sessions, which contain Tests. An event is a race day; a session is a time or condition block; a test compares a set of skis.
- Glide and kick tests run as head-to-head **tournaments** — advance or eliminate skis round by round until a winner is declared.
- **Glide-out tests** measure exact glide distance side-by-side using a two-leg comparison protocol that cancels out skier variation. Results aggregate into a speed ranking with a head-to-head matrix.
- Multiple tests can run simultaneously in a session with different testers assigned to each.

**Wax layers and products**

- Each ski carries a full wax stack: base, paraffin, topcoat, kick layers, and structure tool.
- Multi-product mixing with ratios (e.g. 70% Vauhti HF + 30% Rode Cera).
- 400+ product catalog pre-seeded across 12+ brands. Autocompletes from team history and a shared global seed catalog.

**Conditions**

- Three-level conditions cascade: event-level baseline, session overrides, test-level temp readings.
- Snow and air temperature logged via a combined FAB — one gesture, two readings.
- GPS weather import via Open-Meteo. 48-hour forecast with temperature/precipitation chart.
- Snow crystal type, sky, humidity, wind, grooming, and course notes.

**Race Day and analysis**

- Race Day summary: all winners with conditions, wax stack, feel notes, and race wax decision.
- Conditions trend chart across the day.
- Cross-event product comparison — see how a wax performed across different venues and conditions.
- AI Setup Advisor: reads current conditions and past winners to suggest a full wax setup (powered by Claude Haiku via Netlify function).

**Team collaboration**

- Team code in the URL — everyone on the same code sees the same data in real time via Supabase.
- **Wax Room mode** vs **Field mode** — the wax cabin runs the dashboard; testers run tournaments on their phones.
- Team Board: wax calls, alerts, and notes posted to a shared message feed. Browser notifications for alerts and wax calls when the app is in the background.
- Realtime sync with offline-first architecture — all data writes to localStorage immediately, Supabase syncs in the background.

**Fleet registry**

- Persistent fleet library across events. Glide fleets and kick fleets tracked separately.
- Ski records carry make, flex, grind, grind date, condition, and service flags.
- Quick Add with naming convention picker: `1a/1b/2a/2b`, `A1/A2/B1`, `A/B/C`, `1/2/3`, or custom. Live ID preview before committing.

**Voice commands**

- Web Speech API voice input in the tournament tab.
- AI-powered parsing via Claude Haiku: "advance A1", "eliminate B3", "tie", "snow temp minus 5", "A2 topcoat Rode Endurance", "send wax call A fleet on Vauhti".
- Falls back to regex parser if offline or API is slow.

**Schedule builder**

- Define testing windows before you arrive: start time, close time, result deadline, test types.
- Race time markers on the timeline.
- Activate the schedule to auto-create sessions and tests with deadlines pre-filled.
- Window alerts fire at open, warning threshold, and close.

**Export**

- Excel export with sheets: Race Day, Bracket History, Fleet, Temperatures, Wax Catalog.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 (CDN, no bundler) + JSX compiled at build time via esbuild |
| Fonts | Inter (UI) + IBM Plex Mono (data) |
| Backend | Netlify serverless functions |
| Database | Supabase (Postgres + realtime subscriptions) |
| AI | Anthropic Claude Haiku (server-side via Netlify proxy) |
| Weather | Open-Meteo API (no key required) + Nominatim geocoding |
| Offline | localStorage-first with background Supabase sync and write queue |

The entire app compiles to a single `index.html` (~1MB). No npm dependencies at runtime.

---

## Repository structure

```
├── ski-wax-tracker-v6.jsx   # Full source (~26,000 lines of JSX)
├── build_html.js             # esbuild compile script → index.html
├── build.sh                  # Netlify build entrypoint
├── config.js                 # Runtime config injection (env vars → window.WAXLAB_CONFIG)
├── netlify.toml              # Netlify build + header + redirect config
├── supabase_setup.sql        # All table definitions and RLS policies
├── netlify/
│   └── functions/
│       └── claude-proxy.js   # Serverless proxy for Anthropic API calls
└── index.html                # Built output (generated, not edited directly)
```

---

## Deployment

### Prerequisites

- [Netlify](https://netlify.com) account
- [Supabase](https://supabase.com) project
- [Anthropic](https://console.anthropic.com) API key

### 1. Supabase setup

Run `supabase_setup.sql` in your Supabase project's SQL editor. This creates all tables with appropriate RLS policies:

| Table | Purpose |
|---|---|
| `waxlab_events` | All event/session/test data per team |
| `waxlab_fleets` | Fleet registry per team |
| `waxlab_catalog` | Per-team wax product catalog |
| `waxlab_structure_catalog` | Per-team structure tool catalog |
| `waxlab_seed_catalog` | Global seed catalog (admin-managed) |
| `waxlab_seed_structure_catalog` | Global seed structure tools (admin-managed) |
| `waxlab_vocab` | Autocomplete vocabulary per team |
| `waxlab_messages` | Team Board messages |
| `waxlab_analytics` | Anonymous usage pings |

### 2. Netlify setup

Connect this repository to Netlify. Set the following environment variables in **Site settings → Environment variables**:

```
SUPABASE_URL        https://your-project.supabase.co
SUPABASE_ANON_KEY   your-anon-key
ANTHROPIC_API_KEY   sk-ant-...
```

Netlify will run `build.sh` on each push, which calls `node build_html.js` to compile the JSX source into `index.html` with the config injected.

### 3. Build locally

```bash
node build_html.js
```

Requires Node.js 18+. No `npm install` needed — esbuild is fetched automatically on first run.

---

## Usage

### Team codes

Navigate to your deployed URL and enter a team code — any short string (e.g. `CRAFTSBURY`, `EAST`, `VASA`). Everyone on your wax crew enters the same code. The code is embedded in the URL hash so sharing the URL brings teammates straight in.

The `ADMIN` code opens a global admin panel for managing the seed wax catalog and structure tool catalog.

### Wax Room vs Field mode

On the mode selection screen, choose:

- **Wax Room** — full dashboard with schedule, live results board, conditions editing, and the AI Setup Advisor. Intended for the wax cabin screen.
- **Field** — tournament and glide-out interface optimised for phones. Testers advance/eliminate skis and the wax room sees results instantly.

Both modes share the same data and Team Board.

### First run

Create an event, add sessions via the Schedule tab or manually, then open a session and create a test. Add skis to the Fleet tab. Run the tournament in the Tournament tab.

---

## Voice commands

Available in the Tournament tab. Tap the microphone button and speak naturally.

| Intent | Examples |
|---|---|
| Advance a ski | "Advance A1", "A1 through", "keep B2" |
| Eliminate a ski | "Out A3", "eliminate B2", "drop A1" |
| Declare winner | "Winner A1", "A1 wins", "declare B3" |
| Tie — both advance | "Tie", "draw", "too close" |
| Select a pair | "A1 versus B2", "pair A1 B2" |
| Rate a ski | "Rate A1 glide 8", "A1 kick 6 glide 9" |
| Log temperature | "Snow temp minus 5", "air 28" |
| Set wax layers | "A1 topcoat Rode Endurance", "B3 paraffin Rex Blue" |
| Send team message | "Send wax call A fleet on Vauhti", "Alert snow changing" |
| Undo | "Undo", "oops", "that was wrong" |

---

## Development notes

The source is a single JSX file that intentionally avoids a build-time module system. This keeps deployment simple (one HTML file, no CDN dependencies for production) and makes the codebase easy to edit and verify in one place.

Performance optimisations in place:

- Key derived state (`roundState`, `activeSki`, `winner`) memoized with `useMemo`
- Expensive pure components wrapped with `React.memo` (alias pattern)
- Text input fields use local state with blur-commit and debounce to avoid per-keystroke re-renders
- localStorage-first data layer means all UI updates are synchronous; Supabase writes are fire-and-forget

---

## License

Private repository. All rights reserved.
