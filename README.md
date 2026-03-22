# WanderSync (WanderTogether)

Group travel planning: import links and text, extract places with AI assistance, vote with **pairwise comparisons** and **Elo-style rankings**, merge group preferences, build day itineraries with maps, and run a live execution-style flow. Built for **HackDuke: Code for Good 2026** (Interactive Media track).

This README documents **credits**, **third-party tools**, **what the team built vs. what was generated or imported**, and **AI usage** (product and development) for hackathon integrity requirements.

---

## What we built (original work)

This is **not** a reskin of a single off-the-shelf “AI travel chat” product. The weekend implementation centers on:

- **Domain logic**: trip and activity models, Zustand store, routing, and screen wiring (`src/lib/store.ts`, `src/lib/types.ts`, `src/app/App.tsx`, `src/pages/*`).
- **Pairwise voting**: Elo updates, comparison pairing, and group ranking merge (`src/lib/ranking.ts`).
- **Import pipeline**: TikTok URL handling, transcript fetch path (ScrapeCreators-backed in dev), and orchestration on `ImportPage` (`src/lib/tiktok-*.ts`, `src/pages/ImportPage.tsx`).
- **LLM integration layer**: client helpers, fallbacks where applicable, and server-side Anthropic calls with **hand-written system prompts** (`src/lib/llm/*`, `server/index.ts`, `server/prompts.ts`).
- **Maps & logistics**: Google Maps–related server utilities (geocoding, static map proxy, travel-time enrichment) (`server/google-maps.ts`, `src/lib/geo.ts`, related API routes in `server/index.ts`).
- **Custom Vite plugin**: dev proxy for TikTok transcript API (`vite-plugin-tiktok-transcript-api.ts`).
- **Seed / demo data**: Tokyo activities and coordinates for offline or fallback demos (`src/lib/seed-data.ts`).

**Visual screens** in `src/app/components/` (e.g. `HomeScreen.tsx`, `VotingScreen.tsx`) began as **Figma Make** exports: layout, Tailwind classes, and Radix/shadcn-style UI primitives were preserved as the design reference; **behavior, data, and navigation** were implemented or rewired in `src/pages/*` and the store.

---

## Design & visual assets

| Source | Use in this repo |
|--------|------------------|
| **[Figma — Pairwise Voting Screen](https://www.figma.com/design/XlnK148AhND5iWNsk97jFW/Pairwise-Voting-Screen--Copy-)** | Primary UI layout and styling reference; exported React/Tailwind bundles under `src/app/components/`. |
| **[shadcn/ui](https://ui.shadcn.com/)** (MIT) | UI primitives under `src/app/components/ui/`. |
| **[Unsplash](https://unsplash.com)** | Placeholder photography per [Unsplash License](https://unsplash.com/license). |

See also **`ATTRIBUTIONS.md`** for the short-form Figma Make attribution block.

---

## Third-party software & APIs (runtime)

| Tool / library | Role |
|----------------|------|
| **React 18**, **Vite 6**, **TypeScript** | App shell and build. |
| **React Router 7** | Client routing. |
| **Tailwind CSS 4** | Styling. |
| **Zustand** | Client state. |
| **Motion** (“Framer Motion”) | Transitions / animation. |
| **Radix UI**, **lucide-react**, **class-variance-authority**, **tailwind-merge**, etc. | Accessible primitives and UI utilities (see `package.json`). |
| **Express 5** | Backend API (`server/index.ts`). |
| **Anthropic SDK** (`@anthropic-ai/sdk`) | Server calls to **Claude** for activity extraction, itinerary generation, and trip adaptation (see `server/prompts.ts`). |
| **Google Maps Platform** | Geocoding, distances, static maps (key via `GOOGLE_MAPS_API_KEY`; see `.env.example`). |
| **ScrapeCreators** | Optional TikTok transcript retrieval in development (`SCRAPECREATORS_API_KEY`, `src/lib/scrapecreators-v1.ts`). |

Other `package.json` dependencies (e.g. charts, form helpers) are used as licensed open-source libraries; none replace the core **pairwise ranking + group trip** product story above.

---

## AI usage disclosure (required for MLH / academic integrity)

### 1. AI inside the product (user-facing / runtime)

- **Anthropic Claude** (via API) is used to:
  - Extract structured activities/places from pasted text or transcripts.
  - Generate or adapt multi-day itineraries from ranked activities and preferences.
- **Prompts** are defined in **`server/prompts.ts`** and maintained by the team; the model returns **JSON** consumed by our code—we own the schema, validation, and fallbacks in `src/lib/llm/` and the Express handlers.

If the API key is missing or invalid, the app is intended to remain demo-capable using **seed data** and **client-side fallbacks** where implemented.

### 2. AI used during development (coding assistants / generators)

**Team: edit this subsection before submission with accurate names and scope.**

- **Tools used** Claude for Brainstorming and Cursor with Composer 2 and Opus 4.6
- **How we used them**: e.g. scaffolding components, refactoring, debugging, drafting prompts, writing tests, documentation.
- **What we verified**: we reviewed, tested, and integrated all generated code; we did not ship unreviewed copy-paste as final logic.


---

## Repository layout (quick map)

| Path | Purpose |
|------|---------|
| `src/pages/` | Routed pages wiring Figma-derived screens to store and APIs. |
| `src/app/components/` | Figma Make reference screens (preserve for design fidelity). |
| `src/lib/` | Types, store, ranking, LLM client, TikTok helpers, seed data. |
| `server/` | Express API, Anthropic integration, Google Maps helpers, prompts. |

---

## Setup

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and set:

- `ANTHROPIC_API_KEY` — Claude on the server (optional for demo if fallbacks/seed suffice).
- `GOOGLE_MAPS_API_KEY` — maps/geocoding features.
- `SCRAPECREATORS_API_KEY` — TikTok transcript path in dev (optional).

### Run (API + Vite together)

```bash
npm run dev:all
```

- Vite (UI) is typically at `http://localhost:5173` (proxies `/api` to the backend).
- API default port: `3001` (override with `API_PORT` if needed).

### Run UI only

```bash
npm run dev
```

### Run API only

```bash
npm run dev:server
```

### Build

```bash
npm run build
```

---

## License / compliance note

Third-party packages remain under their respective licenses. Figma-exported and shadcn-derived UI files are subject to those projects’ terms. **Unsplash** images require compliance with the [Unsplash License](https://unsplash.com/license).

---

## Summary

- **Credited**: Figma design source, shadcn/ui, Unsplash, npm ecosystem, Anthropic, Google Maps, ScrapeCreators.
- **Built by the team**: trip/vote/ranking flow, store, routing, server API, prompts, import pipeline, maps enrichment, and integration—not a thin skin on a single generic AI chat template.
