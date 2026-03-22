import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACT_ACTIVITIES_SYSTEM,
  GENERATE_ITINERARY_SYSTEM,
  ADAPT_TRIP_SYSTEM,
} from "./prompts";
import { fetchTikTokTranscriptV1 } from "../src/lib/scrapecreators-v1";
import { isValidMapCoordinate } from "../src/lib/geo";
import {
  enrichItineraryTravelTimes,
  enrichRawActivitiesWithGeocode,
  fetchItineraryStaticMapPng,
  geocodePlaceInDestination,
  geocodeQuery,
  getGoogleMapsApiKey,
  type ItineraryDayLike,
  type TransitModeHint,
} from "./google-maps";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.API_PORT ?? "3001", 10);

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes("your-")) return null;
  return new Anthropic({ apiKey: key });
}

function tryParseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Root (browser often opens http://localhost:3001/ — this is API-only) ─────

app.get("/", (_req, res) => {
  res.json({
    service: "WanderTogether API",
    ok: true,
    hint: "This server exposes /api/* only. Run the app UI with `npm run dev` (Vite, usually http://localhost:5173).",
    try: "/api/health",
  });
});

// ── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: !!getClient() });
});

// ── Itinerary map (Google Static Maps — proxied so API key stays on server) ──

app.get("/api/itinerary-static-map", async (req, res) => {
  const raw = req.query.p;
  // #region agent log
  fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "3d958d",
    },
    body: JSON.stringify({
      sessionId: "3d958d",
      location: "server/index.ts:itinerary-static-map:entry",
      message: "static map request received",
      data: {
        pType: typeof raw,
        pLen: typeof raw === "string" ? raw.length : 0,
      },
      timestamp: Date.now(),
      hypothesisId: "H-B,H-C",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  if (typeof raw !== "string" || !raw.trim()) {
    // #region agent log
    fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3d958d",
      },
      body: JSON.stringify({
        sessionId: "3d958d",
        location: "server/index.ts:itinerary-static-map:400",
        message: "missing p query",
        data: {},
        timestamp: Date.now(),
        hypothesisId: "H-C",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    res.status(400).send("Missing or invalid p= query (lat,lng|lat,lng|…)");
    return;
  }

  const points: { lat: number; lng: number }[] = [];
  for (const seg of raw.split("|")) {
    const chunk = seg.trim();
    if (!chunk) continue;
    const parts = chunk.split(",").map((s) => parseFloat(s.trim()));
    if (
      parts.length >= 2 &&
      isValidMapCoordinate(parts[0], parts[1])
    ) {
      points.push({ lat: parts[0], lng: parts[1] });
    }
  }

  if (points.length === 0) {
    // #region agent log
    fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3d958d",
      },
      body: JSON.stringify({
        sessionId: "3d958d",
        location: "server/index.ts:itinerary-static-map:404",
        message: "no valid points after parse",
        data: { rawSegCount: raw.split("|").length },
        timestamp: Date.now(),
        hypothesisId: "H-C",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    res.status(404).send("No valid coordinates");
    return;
  }

  const key = getGoogleMapsApiKey();
  if (!key) {
    // #region agent log
    fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3d958d",
      },
      body: JSON.stringify({
        sessionId: "3d958d",
        location: "server/index.ts:itinerary-static-map:503",
        message: "no google key",
        data: {},
        timestamp: Date.now(),
        hypothesisId: "H-C",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    res.status(503).send("GOOGLE_MAPS_API_KEY not configured");
    return;
  }

  try {
    const png = await fetchItineraryStaticMapPng(points, key);
    if (!png) {
      // #region agent log
      fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "3d958d",
        },
        body: JSON.stringify({
          sessionId: "3d958d",
          location: "server/index.ts:itinerary-static-map:502",
          message: "fetchItineraryStaticMapPng returned null",
          data: { pointCount: points.length },
          timestamp: Date.now(),
          hypothesisId: "H-A,H-D",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      res.status(502).send("Static map request failed");
      return;
    }
    // #region agent log
    fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3d958d",
      },
      body: JSON.stringify({
        sessionId: "3d958d",
        location: "server/index.ts:itinerary-static-map:200",
        message: "sending png to client",
        data: { byteLength: png.length, pointCount: points.length },
        timestamp: Date.now(),
        hypothesisId: "H-B",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    res.setHeader("Cache-Control", "public, max-age=300");
    res.type("image/png").send(png);
  } catch (err) {
    console.error("itinerary-static-map:", err);
    // #region agent log
    fetch("http://127.0.0.1:7929/ingest/314be68e-e9da-4796-b54a-6124a2eda6f4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "3d958d",
      },
      body: JSON.stringify({
        sessionId: "3d958d",
        location: "server/index.ts:itinerary-static-map:500",
        message: "handler threw",
        data: {
          err: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
        hypothesisId: "H-B",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    res.status(500).send("Server error");
  }
});

// ── TikTok Transcript (proxy to ScrapeCreators) ─────────────────────────────

app.post("/api/tiktok/transcript", async (req, res) => {
  const { url, language = "en", use_ai_as_fallback = false } = req.body as {
    url: string;
    language?: string;
    use_ai_as_fallback?: boolean;
  };

  if (!url?.trim()) {
    res.status(400).json({ ok: false, source: "scrapecreators", error: "url is required" });
    return;
  }

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ ok: false, source: "scrapecreators", error: "SCRAPECREATORS_API_KEY not configured" });
    return;
  }

  try {
    const result = await fetchTikTokTranscriptV1(apiKey, {
      url: url.trim(),
      language,
      useAiAsFallback: use_ai_as_fallback,
    });

    if (!result.ok) {
      res.status(result.status >= 400 ? result.status : 502).json({
        ok: false,
        source: "scrapecreators",
        error: result.message,
      });
      return;
    }

    res.json({
      ok: true,
      source: "scrapecreators",
      ...result.data,
    });
  } catch (err: any) {
    console.error("tiktok/transcript error:", err?.message ?? err);
    res.status(500).json({
      ok: false,
      source: "scrapecreators",
      error: err?.message ?? "Transcript request failed",
    });
  }
});

// ── Extract Activities ───────────────────────────────────────────────────────

app.post("/api/extract-activities", async (req, res) => {
  const { content, sourceUrl, destination } = req.body as {
    content: string;
    sourceUrl?: string;
    /** Trip city/region — used with Google Geocoding to pin accurate coordinates */
    destination?: string;
  };

  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const client = getClient();
  if (!client) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
    return;
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: EXTRACT_ACTIVITIES_SYSTEM,
      messages: [
        {
          role: "user",
          content: sourceUrl
            ? `Source: ${sourceUrl}\n\nContent:\n${content}`
            : content,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    let activities = tryParseJson(text);

    if (!Array.isArray(activities)) {
      res
        .status(500)
        .json({ error: "Expected a JSON array of activities from the model" });
      return;
    }

    const gKey = getGoogleMapsApiKey();
    const dest = destination?.trim();
    if (
      gKey &&
      dest &&
      activities.length > 0
    ) {
      try {
        activities = await enrichRawActivitiesWithGeocode(
          activities,
          dest,
          gKey,
        );
      } catch (geoErr: unknown) {
        console.warn(
          "Geocoding after extract failed:",
          geoErr instanceof Error ? geoErr.message : geoErr,
        );
      }
    }

    res.json({ activities });
  } catch (err: any) {
    console.error("extract-activities error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "LLM request failed" });
  }
});

// ── Geocode place names (import sheet, etc.) ─────────────────────────────────

app.post("/api/geocode-places", async (req, res) => {
  const { destination, places } = req.body as {
    destination: string;
    places: Array<{ name: string; neighborhood?: string }>;
  };

  if (!destination?.trim() || !Array.isArray(places)) {
    res.status(400).json({ error: "destination and places array required" });
    return;
  }

  const gKey = getGoogleMapsApiKey();
  if (!gKey) {
    res.status(503).json({ error: "GOOGLE_MAPS_API_KEY not configured" });
    return;
  }

  try {
    let destinationCenter: { lat: number; lng: number } | null = null;
    const center = await geocodeQuery(destination.trim(), gKey);
    if (center) {
      destinationCenter = { lat: center.lat, lng: center.lng };
    }

    const locations: Array<{
      lat: number;
      lng: number;
      neighborhood: string;
      googlePlaceId: string;
      formattedAddress?: string;
    } | null> = [];

    for (const p of places) {
      if (!p?.name?.trim()) {
        locations.push(null);
        continue;
      }
      const g = await geocodePlaceInDestination(
        p.name.trim(),
        p.neighborhood?.trim() ?? "",
        destination.trim(),
        gKey,
      );
      locations.push(
        g
          ? {
              lat: g.lat,
              lng: g.lng,
              neighborhood: g.neighborhood,
              googlePlaceId: g.googlePlaceId,
              formattedAddress: g.formattedAddress,
            }
          : null,
      );
    }

    res.json({ locations, destinationCenter });
  } catch (err: unknown) {
    console.error("geocode-places error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Geocoding failed",
    });
  }
});

// ── Generate Itinerary ───────────────────────────────────────────────────────

app.post("/api/generate-itinerary", async (req, res) => {
  const { activities, preferences, dates, destination } = req.body as {
    activities: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      estimatedDuration: number;
      location: { lat: number; lng: number; neighborhood: string };
      compositeScore: number;
    }>;
    preferences: {
      pace: string;
      walkingTolerance: string;
      startTime: string;
      endTime: string;
      budget: string;
      priorities: string[];
    };
    dates: { start: string; end: string };
    destination: string;
  };

  if (!activities?.length) {
    res.status(400).json({ error: "activities array is required" });
    return;
  }

  const client = getClient();
  if (!client) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
    return;
  }

  try {
    const startDate = dates?.start ?? new Date().toISOString().slice(0, 10);
    const endDate = dates?.end ?? startDate;
    const numDays = Math.max(1, Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1);

    const userContent = `
Destination: ${destination ?? "Tokyo"}
Trip dates: ${startDate} to ${endDate} (${numDays} days)

Preferences:
${JSON.stringify(preferences, null, 2)}

Ranked activities (highest compositeScore = highest priority):
${JSON.stringify(activities, null, 2)}
`.trim();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: GENERATE_ITINERARY_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const result = tryParseJson(text) as {
      days?: Array<{
        date: string;
        stops: Array<{
          activityId: string;
          startTime: string;
          endTime: string;
          travelToNext: { duration: number; mode: string };
          priority: number;
        }>;
      }>;
      reasoning?: string;
    };

    const gKey = getGoogleMapsApiKey();
    if (
      gKey &&
      result.days?.length &&
      Array.isArray(activities) &&
      activities.length > 0
    ) {
      const activityLocations = new Map(
        activities.map((a) => [
          a.id,
          { lat: a.location.lat, lng: a.location.lng },
        ]),
      );
      try {
        const normalizedDays: ItineraryDayLike[] = result.days.map((d) => ({
          date: d.date,
          stops: d.stops.map((s) => {
            const m = s.travelToNext.mode;
            const mode: TransitModeHint =
              m === "walk" || m === "transit" || m === "taxi" ? m : "walk";
            return {
              ...s,
              travelToNext: {
                duration: s.travelToNext.duration,
                mode,
              },
            };
          }),
        }));
        result.days = await enrichItineraryTravelTimes(
          normalizedDays,
          activityLocations,
          gKey,
        );
      } catch (dmErr: unknown) {
        console.warn(
          "Distance Matrix enrichment failed:",
          dmErr instanceof Error ? dmErr.message : dmErr,
        );
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error("generate-itinerary error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "LLM request failed" });
  }
});

// ── Adapt Trip (Salvage) ─────────────────────────────────────────────────────

app.post("/api/adapt-trip", async (req, res) => {
  const {
    currentItinerary,
    completedIds,
    skippedIds,
    currentTime,
    reason,
    allActivities,
    destination,
  } = req.body as {
    currentItinerary: Array<{
      activityId: string;
      activityName: string;
      startTime: string;
      endTime: string;
      category: string;
      priority: number;
      location: { lat: number; lng: number };
    }>;
    completedIds: string[];
    skippedIds: string[];
    currentTime: string;
    reason?: string;
    allActivities?: Array<{
      id: string;
      name: string;
      category: string;
      estimatedDuration: number;
      location: { lat: number; lng: number; neighborhood: string };
    }>;
    destination?: string;
    detail?: string;
  };

  if (!currentItinerary?.length) {
    res.status(400).json({ error: "currentItinerary is required" });
    return;
  }

  const client = getClient();
  if (!client) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
    return;
  }

  try {
    const { detail } = req.body as { detail?: string };
    const userContent = `
Destination: ${destination ?? "Tokyo"}
Current time: ${currentTime ?? new Date().toTimeString().slice(0, 5)}
Reason for adaptation: ${reason ?? "Plans changed"}
${detail ? `User's situation: ${detail}` : ""}

Completed stops: ${JSON.stringify(completedIds)}
Skipped stops: ${JSON.stringify(skippedIds)}

Current itinerary:
${JSON.stringify(currentItinerary, null, 2)}

${allActivities ? `All available activities (can substitute from these):\n${JSON.stringify(allActivities, null, 2)}` : ""}
`.trim();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: ADAPT_TRIP_SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const result = tryParseJson(text);
    res.json(result);
  } catch (err: any) {
    console.error("adapt-trip error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "LLM request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✓ WanderSync API server on http://localhost:${PORT}`);
  console.log(
    `  Claude:  ${getClient() ? "connected" : "⚠ no API key — will return 503"}`,
  );
  console.log(
    `  Google:  ${getGoogleMapsApiKey() ? "Geocoding + Distance Matrix + Static Maps" : "⚠ no GOOGLE_MAPS_API_KEY — coords/travel from LLM only"}`,
  );
});
