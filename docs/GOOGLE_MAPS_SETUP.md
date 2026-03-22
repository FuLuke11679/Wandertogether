# Google Maps (Geocoding + Distance Matrix)

WanderTogether uses a single **Google Maps Platform** API key on the **Node server** (never exposed to the browser).

## 1. Create a key

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create credentials → API key.
2. **Restrict the key** (recommended):
   - Application restriction: IP addresses (your server) or none for local dev.
   - API restriction: restrict to **Geocoding API**, **Distance Matrix API**, and **Maps Static API** only.

## 2. Enable APIs

In “APIs & Services → Library”, enable:

- **Geocoding API** — resolves place names to coordinates and `place_id` after extraction/import.
- **Distance Matrix API** — refines `travelToNext` durations between itinerary stops.
- **Maps Static API** — renders the itinerary map on the plan screen (proxied at `/api/itinerary-static-map` so the key stays on the server).

Billing must be enabled on the project (Google offers a monthly free tier; see current pricing).

## 3. Configure the app

```bash
# .env (used by npm run dev:server)
GOOGLE_MAPS_API_KEY=your-key-here
```

Restart the API server after changing `.env`.

If the key is missing, the app still runs: extraction uses model coordinates only, import falls back to a coarse grid around the destination center (or Tokyo), and itinerary keeps LLM travel estimates.
