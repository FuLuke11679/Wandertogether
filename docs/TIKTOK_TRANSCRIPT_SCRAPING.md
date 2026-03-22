# TikTok transcript pipeline — implementation handoff (Wander / ScrapeCreators)

## 1. Summary

This backend does **not** call TikTok’s official Partner API for transcripts. It uses **ScrapeCreators** (`api.scrapecreators.com`), a third-party API that returns TikTok video metadata and (when available) **captions/transcripts**.

The app exposes a single Next.js route: **`POST /api/extract`** (`app/api/extract/route.ts`), which:

1. Validates the TikTok URL and API key  
2. Tries **ScrapeCreators v2** video endpoint with **`get_transcript=true`**  
3. If that path doesn’t yield usable text, falls back to **ScrapeCreators v1** transcript endpoint  
4. Optionally **resolves short links** (`vm.tiktok.com`, `tiktok.com/t/...`) to canonical `/@handle/video/{id}` URLs before v1  
5. **Cleans** WebVTT-style transcript text  
6. Runs **heuristic place extraction** on the result (regex + filters) — separate from “getting the transcript” but part of the same response  

**Runtime:** `export const runtime = "nodejs"` — not Edge (uses `fetch`, timeouts, full Node).

> **WanderSync note:** This project uses **Vite + React Router**, not Next.js. When porting, implement the same behavior as a **Node** handler (e.g. `server/extract.ts`, Express route, or Vite `server.proxy` to a small backend) — not Edge.

---

## 2. Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `SCRAPECREATORS_API_KEY` | **Yes** | Sent as `x-api-key` on every ScrapeCreators request. Trim; strip surrounding quotes if present in `.env`. |
| `SCRAPECREATORS_REGION` | No | Query param `region` on **v2** only. Default **`US`** in code. |

No TikTok app id/secret is required for this integration.

---

## 3. Client → server contract (Import UI)

`components/ImportScreen.tsx` calls:

```http
POST /api/extract
Content-Type: application/json
```

```json
{
  "url": "<TikTok video URL>",
  "tripDestination": "Optional city/region for filtering extracted place names"
}
```

Optional body fields the route **accepts** but the current UI does not send:

- `language` — default `"en"` (only used for **v1** transcript)  
- `use_ai_as_fallback` — default `false`; if v1 fails without it, the server retries v1 with `true`  

**Success JSON shape:**

```json
{
  "ok": true,
  "source": "scrapecreators",
  "places": [ { "name", "neighborhood", "confidence" } ],
  "transcriptPreview": "first ~280 chars of cleaned transcript"
}
```

**Error JSON:**

```json
{
  "ok": false,
  "source": "scrapecreators",
  "places": [],
  "error": "human-readable message"
}
```

HTTP status: `400` validation, `500` missing API key, `502` provider/transcript failure.

---

## 4. ScrapeCreators API usage (two endpoints)

### 4.1 v2 — primary path (video + transcript)

- **URL:** `GET https://api.scrapecreators.com/v2/tiktok/video`  
- **Query params:**
  - `url` — TikTok video URL (short link often works; canonical URL is safer)
  - `get_transcript` — `"true"`
  - `region` — from `SCRAPECREATORS_REGION` or `"US"`
- **Headers:** `x-api-key: <SCRAPECREATORS_API_KEY>`, `Accept: application/json`
- **Response:** JSON; structure varies. Code unwraps nested shapes (see §6).

**Success path used in code:** `videoInfo.ok && isVideoInfoBusinessOk(payload) && (v2Transcript || v2FallbackText)`.

### 4.2 v1 — fallback (dedicated transcript only)

- **URL:** `GET https://api.scrapecreators.com/v1/tiktok/video/transcript`  
- **Query params:**
  - `url` — TikTok URL (prefer **canonical** `/@user/video/id` after resolution)
  - `language` — e.g. `en`, `en` list validated in `isSupportedLanguage`: `en, es, fr, de, it, ja, ko, zh`
  - `use_ai_as_fallback` — `"true"` | `"false"`

Same `x-api-key` header.

**Retry strategy (implemented):**

1. Call v1 with `videoUrl = canonicalFromV2 ?? resolved.url`  
2. If not ok and `videoUrl !== original url`, retry v1 with **original** `url`  
3. If still not ok and `use_ai_as_fallback` was false, retry v1 with **`use_ai_as_fallback=true`**

---

## 5. URL normalization and resolution (critical)

**Why:** ScrapeCreators v1 transcript often works better with **`https://www.tiktok.com/@handle/video/1234567890`** than with short links (`tiktok.com/t/...`, `vm.tiktok.com`).

**Steps:**

1. **`normalizeTikTokUrl`** — ensure `https://`, basic validity.  
2. **`isTikTokUrl`** — hostname contains `tiktok.com`.  
3. **`needsTikTokUrlResolution`** — `vm.tiktok.com` or path starts with `/t/`.  
4. **`resolveTikTokCanonicalUrl`** (only if resolution needed):
   - Try **TikTok oEmbed** first: `GET https://www.tiktok.com/oembed?url=<encoded url>`  
     - Parse HTML in JSON for canonical `/@.../video/...` or build from `author_url` + `embed_product_id` / `video_id` / `data-video-id`  
   - Else **manual redirect chain** (up to 20 hops): `GET` with `redirect: "manual"`, follow `Location` until URL matches `/@.../video/\d+`  
   - On `200`, parse HTML: `canonical` link, `og:url`, or regex `RE_TIKTOK_VIDEO_URL`  
   - Fallback: return original URL with method `fallback_original`  

**Regex for canonical video URL:**

```text
https://(www.)?tiktok.com/@[^/]+/video/\d+
```

**User-Agent:** Chrome-like desktop string (see `TIKTOK_BROWSER_UA` in route).

v2 response may include `extractCanonicalUrlFromVideoInfo` candidates (`aweme.url`, `share_url`, etc.) — used to prefer canonical URL before calling v1.

---

## 6. Parsing v2 payload (transcript + “business OK”)

Responses may nest data under `aweme_detail`, `data.aweme_detail`, or `result.aweme_detail`. Helpers:

- **`unwrapScrapeCreatorsV2Payload`**
- **`getAwemeDetail`**
- **`extractTranscriptFromVideoInfo`** — transcript from:
  - top-level `transcript`, or
  - `aweme_detail.transcript`, including after unwrapping

**`isVideoInfoBusinessOk(payload)`:**

- `success === false` → not business-ok  
- `status_code` present and ≠ 0 → not business-ok  
- Else ok  

**`extractFallbackTextFromVideoInfo`** — when transcript is empty but video metadata exists:

- From `aweme`: `desc`, `content_desc`, `title`  
- `original_client_text.markup_text` (strip HTML tags)  
- `music.title`  
- `share_info`: `share_desc`, `share_title`, `share_quote`  

Joined with `\n\n`. Used as **`rawForPlaces`** when there is no transcript string so place heuristics still get *some* text.

---

## 7. WebVTT cleanup (`cleanVtt`)

Transcript may be WebVTT:

- Strip `WEBVTT` header through first blank line block  
- Remove timestamp lines `00:00:00.000 --> 00:00:00.000`  
- Collapse newlines to spaces  

Output is a single-line-ish string for downstream regex.

---

## 8. HTTP 402 (billing / credits)

If **v2** returns **HTTP 402** and there is **no** transcript and **no** fallback text, the handler **skips v1** (same key would typically fail) and returns **502** with a clear error telling the user to fix credits / regenerate API key.

---

## 9. Error surfacing (`extractProviderMessages`)

ScrapeCreators errors may use `message`, `error`, `detail`, `errors[]`, etc. The code collects these and joins them for the client when v1 fails.

---

## 10. After the transcript: place extraction (not “scraping” but same endpoint)

- **`extractPlaceCandidates(payload)`** — regex on `JSON.stringify(payload)` plus transcript (heuristic + loose Title Case + caption snippet fallback).  
- **`filterPlaceCandidates`** — `lib/place-extraction.ts`: denylist, trip destination dedupe, max 12.  

A new repo that **only** needs TikTok transcript can **drop** place extraction and return `{ transcript, transcriptPreview }` instead.

---

## 11. What was explicitly removed from this codebase (historical)

- **Google Gemini** enrichment for places — removed (no `@google/generative-ai`, no `GEMINI_*` env).  
- **Verbose `debug` blobs** on `/api/extract` responses — removed.  
- Do **not** reintroduce these unless you want them.

---

## 12. Files to reference when porting

| Path | Role |
|------|------|
| `app/api/extract/route.ts` | Full pipeline: ScrapeCreators v2/v1, URL resolution, VTT clean, `POST` handler |
| `lib/place-extraction.ts` | Post-processing of place names only |
| `components/ImportScreen.tsx` | Client fetch shape |

---

## 13. Implementation checklist for the new agent

1. Add `SCRAPECREATORS_API_KEY` (and optional `SCRAPECREATORS_REGION`) to env.  
2. Implement **`POST /api/extract`** (or a dedicated **`/api/tiktok/transcript`**) with **Node runtime**.  
3. Call **v2** `GET /v2/tiktok/video?url=...&get_transcript=true&region=...`.  
4. Parse transcript with **`extractTranscriptFromVideoInfo`** + unwrap helpers; check **`isVideoInfoBusinessOk`**.  
5. If no transcript, use **`extractFallbackTextFromVideoInfo`** only if you still want caption-adjacent text.  
6. If v2 path fails or yields nothing usable, **resolve URL** then call **v1** transcript with retries and optional AI fallback.  
7. **Handle 402** without burning v1 calls.  
8. Run **`cleanVtt`** on transcript strings before storage or NLP.  
9. Test with: full URL, short `/t/...` link, `vm.tiktok.com`, and a video with/without captions.  

---

## 14. Docs / product note

- **ScrapeCreators** is a **paid third-party** API; pricing and quotas are on their dashboard.  
- **Official TikTok** transcript APIs (where available) have different auth and compliance rules; this design is **not** a drop-in for TikTok’s Partner API.

---

**Agent prompt:** Implement the section 13 checklist using the API details in sections 4–9; use section 10 only if we need place names again.
