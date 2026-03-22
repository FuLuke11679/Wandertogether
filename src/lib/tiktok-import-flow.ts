import { isTikTokUrl, normalizeTikTokUrl } from "./tiktok-url";
import {
  fetchTikTokTranscript,
  TikTokTranscriptRequestError,
} from "./tiktok-transcript";
import { extractPlacesFromTranscript } from "./extract-places-from-transcript";
import type { ExtractedPlace } from "./extracted-place";

export type TikTokExtractResult =
  | { normalizedUrl: string; places: ExtractedPlace[] }
  | { error: string };

/**
 * Normalize URL → ScrapeCreators v1 transcript → heuristic place extraction.
 */
export async function extractPlacesFromTikTokUrl(
  rawUrl: string,
  options?: { tripDestination?: string; useAiAsFallback?: boolean },
): Promise<TikTokExtractResult> {
  if (!isTikTokUrl(rawUrl)) {
    return {
      error:
        "Paste a TikTok video link (e.g. tiktok.com/… or vm.tiktok.com/…).",
    };
  }

  let normalized: string;
  try {
    normalized = normalizeTikTokUrl(rawUrl);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid URL" };
  }

  try {
    const res = await fetchTikTokTranscript({
      url: normalized,
      language: "en",
      useAiAsFallback: options?.useAiAsFallback ?? false,
    });

    const places = extractPlacesFromTranscript(res.transcriptPlain, {
      tripDestination: options?.tripDestination,
    });

    if (places.length === 0) {
      return {
        error:
          "No place names were detected in the transcript. Try another video or add a place manually.",
      };
    }

    return { normalizedUrl: normalized, places };
  } catch (e) {
    if (e instanceof TikTokTranscriptRequestError) {
      return { error: e.body.error || e.message };
    }
    return {
      error: e instanceof Error ? e.message : "Could not fetch transcript",
    };
  }
}
