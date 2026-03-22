import { useState, useRef } from "react";
import { PlaceSelectionSheet } from "./PlaceSelectionSheet";
import type { ExtractedPlace } from "../../lib/extracted-place";
import { useTripStore } from "../../lib/store";
import type { Activity } from "../../lib/types";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const CORAL = "#E85D3A";
const DARK  = "#1A1A1A";
const BG    = "#FAFAF8";

// ─── Mock extracted data (simulates backend response) ─────────────────────────
const MOCK_PLACES: ExtractedPlace[] = [
  { id: 1, name: "Senso-ji Temple",           category: "Culture",   emoji: "⛩️", duration: "45 min", checked: true },
  { id: 2, name: "Tsukiji Outer Market",       category: "Food",      emoji: "🍜", duration: "1 hr",   checked: true },
  { id: 3, name: "Meiji Shrine",               category: "Culture",   emoji: "🏯", duration: "1.5 hr", checked: true },
  { id: 4, name: "Harajuku Takeshita Street",  category: "Shopping",  emoji: "🛍️", duration: "1 hr",   checked: true },
  { id: 5, name: "Golden Gai",                 category: "Nightlife", emoji: "🍸", duration: "2 hr",   checked: true },
];

// ─── Recent imports history (mock) ────────────────────────────────────────────
interface RecentImport {
  id: string;
  url: string;
  count: number;
  trip: string;
  time: string;
}

const RECENT: RecentImport[] = [
  { id: "r1", url: "youtube.com/@wanderlust/tokyo-guide",       count: 5, trip: "Tokyo Adventure", time: "2h ago" },
  { id: "r2", url: "tiktok.com/@tokyofoodie/7234981234567",    count: 3, trip: "Tokyo Adventure", time: "Yesterday" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes ws-fadeup {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes coral-progress {
    0%   { width: 8%;  }
    100% { width: 78%; }
  }
  .imp-fadeup { animation: ws-fadeup 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .imp-input:focus { outline: none; border-color: ${CORAL} !important; }
  .imp-input::placeholder { color: #C5BEB6; font-style: italic; }
  .shimmer-line {
    background: linear-gradient(90deg, #f0ece6 25%, #e6e2dc 50%, #f0ece6 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite linear;
    border-radius: 6px;
  }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
`;

// ─── Nav icons ────────────────────────────────────────────────────────────────
function NavHome({ active }: { active?: boolean }) {
  const c = active ? CORAL : "#B0A99F";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3.5 9.5L11 3l7.5 6.5V19a1 1 0 01-1 1h-4v-5H8.5v5h-4a1 1 0 01-1-1V9.5z"
        stroke={c} strokeWidth="1.6" strokeLinejoin="round" fill={active ? CORAL + "15" : "none"} />
    </svg>
  );
}
function NavExplore() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8.5" stroke="#B0A99F" strokeWidth="1.6" />
      <path d="M14.5 7.5l-2 4.5-4.5 2 2-4.5 4.5-2z" stroke="#B0A99F" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="1" fill="#B0A99F" />
    </svg>
  );
}
function NavImport({ active }: { active?: boolean }) {
  const c = active ? CORAL : "#B0A99F";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3.5" y="3.5" width="15" height="15" rx="4" stroke={c} strokeWidth="1.6" fill={active ? CORAL + "12" : "none"} />
      <path d="M11 7.5v7M7.5 11.5l3.5 3.5 3.5-3.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NavProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8.5" r="3.5" stroke="#B0A99F" strokeWidth="1.6" />
      <path d="M4.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="#B0A99F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="6" stroke="#EAE6E0" strokeWidth="1.8" />
      <path d="M7.5 1.5a6 6 0 016 6" stroke={CORAL} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ─── Link icon ────────────────────────────────────────────────────────────────
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5L7.5 3.5" stroke="#C5BEB6" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5L8.5 12.5" stroke="#C5BEB6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function activitiesToPlaces(activities: Activity[]): ExtractedPlace[] {
  return activities.map((a, i) => ({
    id: i + 1,
    name: a.name,
    category: a.category.charAt(0).toUpperCase() + a.category.slice(1),
    emoji: a.emoji ?? "📍",
    duration: `${a.estimatedDuration} min`,
    checked: true,
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface ImportScreenProps {
  onBack: () => void;
  onGoHome?: () => void;
  tripId?: string;
  tripName?: string;
  /**
   * Called when the user hits "Extract". Receives the raw URL, fetches the
   * transcript (for TikTok) or raw content, sends it through the LLM, and
   * returns Activity[] for the selection sheet.
   */
  onExtract?: (rawUrl: string) => Promise<{ activities: Activity[]; displayUrl: string }>;
  /** Called with checked places after user confirms import */
  onImportPlaces?: (places: ExtractedPlace[]) => void | Promise<void>;
}

type LoadState = "idle" | "loading" | "done";

export function ImportScreen({
  onBack,
  onGoHome,
  tripId,
  tripName,
  onExtract,
  onImportPlaces,
}: ImportScreenProps) {
  const [url, setUrl]           = useState("");
  const [loadState, setLoad]    = useState<LoadState>("idle");
  const [sheetOpen, setSheet]   = useState(false);
  const [manualOpen, setManual] = useState(false);
  const [manualName, setMName]  = useState("");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedPlaces, setExtractedPlaces] = useState<ExtractedPlace[] | null>(null);
  const [displayUrl, setDisplayUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canExtract = url.trim().length > 4;

  const handleExtract = async () => {
    if (!canExtract) return;
    setExtractError(null);
    setLoad("loading");

    try {
      if (onExtract) {
        const result = await onExtract(url.trim());
        setExtractedPlaces(activitiesToPlaces(result.activities));
        setDisplayUrl(result.displayUrl);
      } else {
        setExtractedPlaces(MOCK_PLACES);
        setDisplayUrl(url);
      }
      setLoad("done");
      setSheet(true);
    } catch (e) {
      setExtractError(
        e instanceof Error ? e.message : "Something went wrong extracting places.",
      );
      setLoad("idle");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExtract();
  };

  const handleImport = async (
    places: ExtractedPlace[],
    _tripIdFromSheet: string,
  ) => {
    if (onImportPlaces) {
      await onImportPlaces(places);
      setUrl("");
      setLoad("idle");
      setExtractedPlaces(null);
      return;
    }

    setLoad("idle");
    setUrl("");
    setExtractedPlaces(null);

    if (tripId) {
      const { extractedPlacesToActivities } = await import(
        "../../lib/places-to-activities"
      );
      const activities = await extractedPlacesToActivities(
        places,
        tripName ?? "",
        tripName ?? "",
      );
      useTripStore.getState().addActivities(tripId, activities);
    }
  };

  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: BG,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
      }}
    >
      <style>{STYLES}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div
        className="imp-fadeup"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 54,
          paddingBottom: 14,
          paddingLeft: 20,
          paddingRight: 20,
          flexShrink: 0,
          position: "relative",
          borderBottom: "1px solid #EDE9E4",
        }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            left: 18,
            top: 56,
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 0",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10l5 5" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: DARK }}>Back</span>
        </button>

        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22,
            color: DARK,
            margin: 0,
            letterSpacing: "-0.3px",
            lineHeight: 1.2,
          }}
        >
          Add Places
        </h1>
        <span style={{ fontSize: 12, color: "#A09888", marginTop: 3 }}>
          {tripName ?? "Tokyo Adventure"}
        </span>
      </div>

      {/* ── SCROLLABLE BODY ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "22px 20px 20px",
          minHeight: 0,
        } as React.CSSProperties}
      >

        {/* ── HERO LABEL ── */}
        <div className="imp-fadeup" style={{ animationDelay: "0.04s", marginBottom: 14 }}>
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: "italic",
              fontSize: 16,
              color: "#8A7E72",
              margin: "0 0 4px",
              lineHeight: 1.35,
            }}
          >
            Paste any travel link — TikTok, YouTube, blog post — and we'll pull out the places for you.
          </p>
        </div>

        {/* ── URL INPUT ── */}
        <div className="imp-fadeup" style={{ animationDelay: "0.08s", marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              border: `1.5px solid ${loadState === "loading" ? CORAL + "70" : "#E8E4DE"}`,
              borderRadius: 14,
              padding: "0 6px 0 13px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              height: 54,
              transition: "border-color 0.2s ease",
              gap: 8,
            }}
          >
            {loadState === "loading" ? <Spinner /> : <LinkIcon />}

            <input
              ref={inputRef}
              className="imp-input"
              value={url}
              onChange={e => {
                setUrl(e.target.value);
                if (loadState !== "idle") setLoad("idle");
                setExtractError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste a link and hit Extract…"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13.5,
                color: DARK,
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* ── EXTRACT BUTTON ── */}
        <div className="imp-fadeup" style={{ animationDelay: "0.12s", marginBottom: 28 }}>
          <button
            onClick={handleExtract}
            disabled={!canExtract || loadState === "loading"}
            style={{
              width: "100%",
              height: 50,
              background: canExtract && loadState !== "loading" ? CORAL : "#EDE9E4",
              border: "none",
              borderRadius: 14,
              cursor: canExtract && loadState !== "loading" ? "pointer" : "default",
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: canExtract && loadState !== "loading" ? "white" : "#B0A99F",
              letterSpacing: "-0.1px",
              transition: "all 0.18s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: canExtract && loadState !== "loading" ? "0 4px 16px rgba(232,93,58,0.28)" : "none",
            }}
          >
            {loadState === "loading" ? (
              <>
                <Spinner />
                <span style={{ color: "#B0A99F" }}>Extracting places…</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="6.5" stroke={canExtract ? "white" : "#B0A99F"} strokeWidth="1.4" />
                  <path d="M5 7.5l2 2 3.5-3.5" stroke={canExtract ? "white" : "#B0A99F"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Extract Places
              </>
            )}
          </button>
        </div>

        {extractError && (
          <div
            className="imp-fadeup"
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              background: "#FFF0EB",
              border: "1px solid #F0C9BC",
              borderRadius: 12,
              fontFamily: "'Inter', sans-serif",
              fontSize: 12.5,
              color: "#8B3D2E",
              lineHeight: 1.45,
            }}
          >
            {extractError}
          </div>
        )}

        {/* ── LOADING SKELETON CARD (while processing) ── */}
        {loadState === "loading" && (
          <div
            className="imp-fadeup"
            style={{
              background: "white",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              marginBottom: 22,
              overflow: "hidden",
            }}
          >
            {/* URL row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div className="shimmer-line" style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0 }} />
              <div className="shimmer-line" style={{ flex: 1, height: 11 }} />
            </div>
            {/* Skeleton place rows */}
            {[72, 88, 64, 80].map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <div className="shimmer-line" style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0 }} />
                <div className="shimmer-line" style={{ width: `${w}%`, height: 12 }} />
                <div className="shimmer-line" style={{ width: 52, height: 20, borderRadius: 99, flexShrink: 0 }} />
              </div>
            ))}
            {/* Progress bar */}
            <div style={{ height: 3, background: "#F0EDE9", borderRadius: 99, marginTop: 16, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                borderRadius: 99,
                background: `linear-gradient(90deg, ${CORAL}88, ${CORAL})`,
                animation: "coral-progress 1.8s cubic-bezier(0.22,1,0.36,1) forwards",
              }} />
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#B0A99F", fontStyle: "italic", margin: "10px 0 0", textAlign: "center" as const }}>
              Reading your link and finding locations…
            </p>
          </div>
        )}

        {/* ── DIVIDER ── */}
        <div
          className="imp-fadeup"
          style={{ animationDelay: "0.16s", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
        >
          <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 13, color: "#C5BEB6" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
        </div>

        {/* ── MANUAL ADD (collapsed by default) ── */}
        <div className="imp-fadeup" style={{ animationDelay: "0.20s", marginBottom: 28 }}>
          {!manualOpen ? (
            <button
              onClick={() => setManual(true)}
              style={{
                width: "100%",
                padding: "13px 0",
                background: "white",
                border: "1.5px dashed #DDD9D3",
                borderRadius: 14,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13.5,
                fontWeight: 500,
                color: "#9A9080",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#B0A99F" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Add a place manually
            </button>
          ) : (
            <div
              style={{
                background: "white",
                border: "1.5px solid #EDE9E4",
                borderRadius: 14,
                padding: "14px 14px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9A9080", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                  Manual entry
                </span>
                <button
                  onClick={() => { setManual(false); setMName(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="#B0A99F" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <input
                className="imp-input"
                autoFocus
                value={manualName}
                onChange={e => setMName(e.target.value)}
                placeholder="Place name, e.g. Omotesando Hills"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1.5px solid #EDE9E4",
                  borderRadius: 10,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  color: DARK,
                  background: "#FAFAF8",
                  marginBottom: 10,
                  transition: "border-color 0.15s ease",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = CORAL)}
                onBlur={e => (e.currentTarget.style.borderColor = "#EDE9E4")}
              />
              <button
                disabled={!manualName.trim()}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  background: manualName.trim() ? CORAL : "#EDE9E4",
                  border: "none",
                  borderRadius: 10,
                  cursor: manualName.trim() ? "pointer" : "default",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: manualName.trim() ? "white" : "#B0A99F",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke={manualName.trim() ? "white" : "#B0A99F"} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add to Trip
              </button>
            </div>
          )}
        </div>

        {/* ── RECENT IMPORTS ── */}
        {RECENT.length > 0 && (
          <div className="imp-fadeup" style={{ animationDelay: "0.24s" }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: "#A09888", letterSpacing: "0.05em", textTransform: "uppercase" as const, margin: "0 0 10px" }}>
              Recently imported
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RECENT.map(r => (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    border: "1px solid #EDE9E4",
                    borderRadius: 12,
                    padding: "11px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#F5F2EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5A5.5 5.5 0 117 12.5" stroke="#B0A99F" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M7 1.5V4M7 7l2 1.5" stroke="#B0A99F" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: DARK, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.url}
                    </div>
                    <div style={{ fontSize: 11, color: "#A09888", marginTop: 2 }}>
                      {r.count} places → {r.trip}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#C5BEB6", flexShrink: 0 }}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRO TIP ── */}
        <div className="imp-fadeup" style={{ animationDelay: "0.28s", display: "flex", alignItems: "flex-start", gap: 7, padding: "22px 2px 8px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="7" cy="7" r="6" stroke="#C5BEB6" strokeWidth="1.2" />
            <path d="M7 6.5V10M7 4.5v.5" stroke="#C5BEB6" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#B0A99F", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
            <strong style={{ fontStyle: "normal", fontWeight: 600 }}>Pro tip:</strong>{" "}
            "Top 10" travel blogs and YouTube guides work best — the more places mentioned, the richer the import.
          </p>
        </div>

      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          height: 82,
          background: "rgba(250,250,248,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: 16,
        }}
      >
        {[
          { icon: <NavHome />,         label: "Home",    active: false, onClick: onGoHome ?? onBack },
          { icon: <NavExplore />,      label: "Explore", active: false, onClick: undefined },
          { icon: <NavImport active />,label: "Import",  active: true,  onClick: undefined },
          { icon: <NavProfile />,      label: "Profile", active: false, onClick: undefined },
        ].map(tab => (
          <button
            key={tab.label}
            onClick={tab.onClick}
            style={{
              background: "none",
              border: "none",
              cursor: tab.onClick ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 14px",
            }}
          >
            {tab.icon}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                fontWeight: tab.active ? 600 : 400,
                color: tab.active ? CORAL : "#B0A99F",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── PLACE SELECTION SHEET ── */}
      {sheetOpen && (
        <PlaceSelectionSheet
          sourceUrl={displayUrl || url}
          places={extractedPlaces ?? MOCK_PLACES}
          onClose={() => {
            setSheet(false);
            setLoad("idle");
            setExtractedPlaces(null);
          }}
          onImport={handleImport}
          lockedTripId={tripId}
          lockedTripName={tripName}
        />
      )}
    </div>
  );
}
