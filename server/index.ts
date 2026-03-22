import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACT_ACTIVITIES_SYSTEM,
  GENERATE_ITINERARY_SYSTEM,
  ADAPT_TRIP_SYSTEM,
} from "./prompts";
import { fetchTikTokTranscriptV1 } from "../src/lib/scrapecreators-v1";

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

// ── Health ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: !!getClient() });
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
  const { content, sourceUrl } = req.body as {
    content: string;
    sourceUrl?: string;
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
    const activities = tryParseJson(text);
    res.json({ activities });
  } catch (err: any) {
    console.error("extract-activities error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "LLM request failed" });
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
    const result = tryParseJson(text);
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
    const userContent = `
Destination: ${destination ?? "Tokyo"}
Current time: ${currentTime ?? new Date().toTimeString().slice(0, 5)}
Reason for adaptation: ${reason ?? "Plans changed"}

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
});
