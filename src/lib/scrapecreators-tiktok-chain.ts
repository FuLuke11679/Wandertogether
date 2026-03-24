/**
 * Server-only: TikTok transcript via ScrapeCreators.
 * Delegates to v1 GET endpoint; `region` is reserved for future routing.
 */

import {
  fetchTikTokTranscriptV1,
  type V1Success,
} from "./scrapecreators-v1";

export type ScrapeCreatorsChainParams = {
  url: string;
  language: string;
  useAiAsFallback: boolean;
  /** Reserved if ScrapeCreators adds regional endpoints. */
  region: string;
};

export async function fetchTikTokTranscriptScrapeCreators(
  apiKey: string,
  params: ScrapeCreatorsChainParams,
  signal?: AbortSignal,
): Promise<
  | { ok: true; data: V1Success }
  | { ok: false; status: number; body: unknown; message: string }
> {
  void params.region;
  return fetchTikTokTranscriptV1(
    apiKey,
    {
      url: params.url,
      language: params.language,
      useAiAsFallback: params.useAiAsFallback,
    },
    signal,
  );
}
