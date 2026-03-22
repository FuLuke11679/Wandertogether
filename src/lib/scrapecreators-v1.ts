/**
 * Server-only: GET ScrapeCreators v1 TikTok transcript (used by Vite middleware).
 * Do not import from React components — the API key must not reach the bundle.
 */

import { cleanVtt } from "./tiktok-transcript";

const SCRAPECREATORS_TRANSCRIPT_V1 =
  "https://api.scrapecreators.com/v1/tiktok/video/transcript";

export type FetchV1Params = {
  url: string;
  language: string;
  useAiAsFallback: boolean;
};

export type V1Success = {
  id: string;
  url: string;
  transcript: string;
  transcriptPlain: string;
};

/** Shared with v2 / chain for consistent error text from ScrapeCreators JSON bodies. */
export function extractProviderMessage(body: unknown): string | undefined {
  if (body === null || body === undefined) return undefined;
  if (typeof body === "string") return body;
  if (typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of ["message", "error", "detail"] as const) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  const errors = o.errors;
  if (Array.isArray(errors)) {
    for (const e of errors) {
      if (typeof e === "string" && e.trim()) parts.push(e.trim());
      else if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string")
        parts.push(String((e as { message: string }).message).trim());
    }
  }
  if (parts.length) return parts.join(" — ");
  return undefined;
}

export async function fetchTikTokTranscriptV1(
  apiKey: string,
  params: FetchV1Params,
  signal?: AbortSignal,
): Promise<
  | { ok: true; data: V1Success }
  | { ok: false; status: number; body: unknown; message: string }
> {
  const u = new URL(SCRAPECREATORS_TRANSCRIPT_V1);
  u.searchParams.set("url", params.url);
  u.searchParams.set("language", params.language);
  u.searchParams.set(
    "use_ai_as_fallback",
    params.useAiAsFallback ? "true" : "false",
  );

  const res = await fetch(u.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    signal,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg =
      extractProviderMessage(json) ||
      `ScrapeCreators returned ${res.status}`;
    return { ok: false, status: res.status, body: json, message: msg };
  }

  const obj = json as Record<string, unknown>;
  const transcript =
    typeof obj.transcript === "string" ? obj.transcript : "";
  const id = typeof obj.id === "string" ? obj.id : "";
  const urlOut = typeof obj.url === "string" ? obj.url : params.url;

  if (!transcript.trim()) {
    return {
      ok: false,
      status: res.status,
      body: json,
      message:
        extractProviderMessage(json) || "Transcript missing in response",
    };
  }

  return {
    ok: true,
    data: {
      id,
      url: urlOut,
      transcript,
      transcriptPlain: cleanVtt(transcript),
    },
  };
}
