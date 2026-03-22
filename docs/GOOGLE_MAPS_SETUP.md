# Google Maps Platform setup

WanderTogether uses a single **Google Maps Platform API key** on the **Node server** (never exposed to the browser for server-side calls).

## What the Console “enable service” names mean

In **Billing → Account history** or activity logs, Google often shows **internal service IDs** like:

| Activity log name | What you enabled (Library UI) |
|-------------------|-------------------------------|
| `geocoding-backend.googleapis.com` | **Geocoding API** |
| `distance-matrix-backend.googleapis.com` | **Distance Matrix API** |
| `static-maps-backend.googleapis.com` | **Maps Static API** |
| `places.googleapis.com` / `places-backend.googleapis.com` | **Places API** (Places API New / related) |

That is normal. If those appear for **My First Project**, the right products are turned on for that project.

## What this app uses today

| API | Purpose |
|-----|--------|
| **Geocoding API** | After extraction/import: resolve place names → `lat`, `lng`, `place_id`, `formatted_address` (stored as `formattedAddress` for Google Maps links). |
| **Distance Matrix API** | After itinerary generation: realistic `travelToNext` durations. |
| **Maps Static API** | Itinerary plan screen map image (`/api/itinerary-static-map`). |

**Places API** — optional for the current codebase; we do not call Places endpoints yet. Enabling it is fine if you plan to add autocomplete, Text Search, or richer place disambiguation later.

## 1. Create a key

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
2. **Restrict the key** (recommended after it works):
   - **Application**: IP addresses (your server) or none for local dev only.
   - **APIs**: at minimum **Geocoding**, **Distance Matrix**, **Maps Static API**. Add **Places** only if you use it.

## 2. Enable APIs & billing

In **APIs & Services → Library**, enable the products above. **Link a billing account** to the project; new accounts often include credits, but Maps calls usually require billing to be active.

## 3. Configure the app

```bash
# .env (used by npm run dev:server)
GOOGLE_MAPS_API_KEY=your-key-here
```

Restart the API server after changing `.env`.

### Static map image size limit

Maps Static output is capped at **640px per dimension**. This app uses **`size=390x270`** with **`scale=1`** so the request stays valid. Using `scale=2` with that size exceeds the limit and breaks the map.

## If the key is missing

The app still runs: extraction falls back on model-only coordinates, import may use a coarse fallback grid, and itinerary travel times stay LLM-based.
