/**
 * Normalize user-pasted TikTok URLs for ScrapeCreators (https, host cleanup).
 */

export function isTikTokUrl(input: string): boolean {
  const s = input.trim();
  if (!s) return false;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const h = new URL(withProto).hostname.toLowerCase();
    return h === "tiktok.com" || h.endsWith(".tiktok.com");
  } catch {
    return false;
  }
}

/**
 * Ensures scheme, normalizes main TikTok host to `www.tiktok.com` when applicable.
 * Preserves `vm.tiktok.com`, `vt.tiktok.com`, and regional hosts — those often need to stay as-is for redirects.
 */
export function normalizeTikTokUrl(input: string): string {
  let s = input.trim();
  if (!s) throw new Error("Enter a TikTok link");

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    throw new Error("That doesn’t look like a valid URL");
  }

  const host = u.hostname.toLowerCase();

  if (host !== "localhost" && !host.includes("tiktok.com")) {
    throw new Error("Use a TikTok video link (tiktok.com)");
  }

  // Main site without subdomain → www (matches common canonical form)
  if (host === "tiktok.com") {
    u.hostname = "www.tiktok.com";
  }

  // Normalize path: drop empty hash, keep query if present
  u.hash = "";

  return u.toString();
}
