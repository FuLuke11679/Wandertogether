/**
 * Client-safe types + helpers for TikTok transcript (ScrapeCreators v1).
 * The actual API key is only used in Vite dev/preview middleware — see vite-plugin-tiktok-transcript-api.ts.
 */

export const TRANSCRIPT_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "ja",
  "ko",
  "zh",
] as const;

export type TranscriptLanguage = (typeof TRANSCRIPT_LANGUAGES)[number];

export function isTranscriptLanguage(x: string): x is TranscriptLanguage {
  return (TRANSCRIPT_LANGUAGES as readonly string[]).includes(x);
}

/** Raw ScrapeCreators v1 success body */
export type ScrapeCreatorsTranscriptPayload = {
  id: string;
  url: string;
  transcript: string;
};

/** Normalized success returned by our `/api/tiktok/transcript` route */
export type TikTokTranscriptApiSuccess = {
  ok: true;
  source: "scrapecreators";
} & ScrapeCreatorsTranscriptPayload & {
    transcriptPlain: string;
  };

export type TikTokTranscriptApiError = {
  ok: false;
  source: "scrapecreators";
  error: string;
  status?: number;
};

export type TikTokTranscriptApiResponse = TikTokTranscriptApiSuccess | TikTokTranscriptApiError;

export class TikTokTranscriptRequestError extends Error {
  readonly status: number;
  readonly body: TikTokTranscriptApiError;

  constructor(message: string, status: number, body: TikTokTranscriptApiError) {
    super(message);
    this.name = "TikTokTranscriptRequestError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Strip WebVTT header, cue timestamps, and collapse whitespace for search / UI.
 */
export function cleanVtt(raw: string): string {
  let s = raw.trim();
  if (s.toUpperCase().startsWith("WEBVTT")) {
    const firstBlank = s.search(/\n\s*\n/);
    if (firstBlank !== -1) s = s.slice(firstBlank).trim();
  }
  s = s.replace(
    /\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}/g,
    " ",
  );
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export type FetchTikTokTranscriptOptions = {
  /** TikTok video URL */
  url: string;
  language?: TranscriptLanguage;
  /** Uses extra credits when transcript is missing; only applies to videos under 2 minutes. */
  useAiAsFallback?: boolean;
  /** Abort long-running requests (default ~60s on server). */
  signal?: AbortSignal;
};

/**
 * Calls the local dev/preview API (`POST /api/tiktok/transcript`), which forwards to ScrapeCreators with the server-side key.
 * In production you must expose the same route on your host or replace this with your backend URL.
 */
export async function fetchTikTokTranscript(
  options: FetchTikTokTranscriptOptions,
): Promise<TikTokTranscriptApiSuccess> {
  const { url, language = "en", useAiAsFallback = false, signal } = options;

  const res = await fetch("/api/tiktok/transcript", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      language,
      use_ai_as_fallback: useAiAsFallback,
    }),
    signal,
  });

  let data: TikTokTranscriptApiResponse;
  try {
    data = (await res.json()) as TikTokTranscriptApiResponse;
  } catch {
    throw new TikTokTranscriptRequestError(
      "Invalid JSON from transcript API",
      res.status,
      {
        ok: false,
        source: "scrapecreators",
        error: res.statusText || "Invalid response",
      },
    );
  }

  if (!res.ok || !data.ok) {
    const err: TikTokTranscriptApiError =
      data && typeof data === "object" && "ok" in data && data.ok === false
        ? data
        : {
            ok: false,
            source: "scrapecreators",
            error: res.statusText || `Request failed (${res.status})`,
          };
    throw new TikTokTranscriptRequestError(
      err.error || `Request failed (${res.status})`,
      res.status,
      err,
    );
  }

  return data;
}
