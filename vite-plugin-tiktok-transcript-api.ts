import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { loadEnv } from "vite";
import { fetchTikTokTranscriptV1 } from "./src/lib/scrapecreators-v1";

function trimApiKey(raw: string | undefined): string {
  if (!raw) return "";
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return s.trim();
}

function isTikTokUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "tiktok.com" || h.endsWith(".tiktok.com");
  } catch {
    return false;
  }
}

function readJsonBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: object,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function createMiddleware(getApiKey: () => string): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const pathOnly = req.url?.split("?")[0] ?? "";
    if (pathOnly !== "/api/tiktok/transcript" || req.method !== "POST") {
      next();
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      sendJson(res, 503, {
        ok: false,
        source: "scrapecreators",
        error:
          "SCRAPECREATORS_API_KEY is not set. Add it to .env for local dev.",
      });
      return;
    }

    let rawBody: string;
    try {
      rawBody = await readJsonBody(req);
    } catch {
      sendJson(res, 400, {
        ok: false,
        source: "scrapecreators",
        error: "Could not read request body",
      });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      sendJson(res, 400, {
        ok: false,
        source: "scrapecreators",
        error: "Invalid JSON body",
      });
      return;
    }

    const url =
      typeof body.url === "string" ? body.url.trim() : "";
    const language =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim().toLowerCase()
        : "en";
    const useAiAsFallback = Boolean(body.use_ai_as_fallback);

    if (!url) {
      sendJson(res, 400, {
        ok: false,
        source: "scrapecreators",
        error: "Missing required field: url",
      });
      return;
    }

    if (!isTikTokUrl(url)) {
      sendJson(res, 400, {
        ok: false,
        source: "scrapecreators",
        error: "url must be a TikTok link (tiktok.com)",
      });
      return;
    }

    const controller = new AbortController();
    const timeoutMs = 60_000;
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fetchTikTokTranscriptV1(
        apiKey,
        {
          url,
          language,
          useAiAsFallback,
        },
        controller.signal,
      );

      if (!result.ok) {
        const status =
          result.status === 401 || result.status === 403
            ? 502
            : result.status === 402
              ? 502
              : result.status >= 500
                ? 502
                : 502;
        sendJson(res, status, {
          ok: false,
          source: "scrapecreators",
          error: result.message,
          status: result.status,
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        source: "scrapecreators",
        id: result.data.id,
        url: result.data.url,
        transcript: result.data.transcript,
        transcriptPlain: result.data.transcriptPlain,
      });
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      sendJson(res, 504, {
        ok: false,
        source: "scrapecreators",
        error: aborted
          ? `Transcript request timed out after ${timeoutMs / 1000}s`
          : e instanceof Error
            ? e.message
            : "Request failed",
      });
    } finally {
      clearTimeout(t);
    }
  };
}

export function tiktokTranscriptApiPlugin(): Plugin {
  let getApiKey: () => string = () => "";

  return {
    name: "tiktok-transcript-api",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "");
      const key = trimApiKey(env.SCRAPECREATORS_API_KEY);
      getApiKey = () => key;
    },
    configureServer(server) {
      server.middlewares.use(createMiddleware(() => getApiKey()));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(() => getApiKey()));
    },
  };
}
