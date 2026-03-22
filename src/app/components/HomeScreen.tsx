import { useState, useEffect, useMemo, useRef } from "react";
import { CreateTripSheet } from "./CreateTripSheet";
import { useTripStore } from "../../lib/store";
import { SEED_TRIP } from "../../lib/seed-data";
import type { Trip } from "../../lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const CORAL  = "#E85D3A";
const SAGE   = "#2D5F4E";
const BG     = "#FAFAF8";
const DARK   = "#1A1A1A";

const TOKYO_IMG =
  "https://images.unsplash.com/photo-1770953176837-dec4a34236ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMHNreWxpbmUlMjBuaWdodCUyMGR1c2slMjBjaXR5JTIwbGlnaHRzfGVufDF8fHx8MTc3NDAzNjc4Mnww&ixlib=rb-4.1.0&q=80&w=1080";
const RIO_IMG =
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const GENERIC_TRIP_IMG =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function coverImageForTrip(trip: Trip): string {
  if (trip.coverImage) return trip.coverImage;
  if (trip.id === SEED_TRIP.id) return TOKYO_IMG;
  const d = trip.destination.toLowerCase();
  if (d.includes("rio") || d.includes("brazil")) return RIO_IMG;
  return GENERIC_TRIP_IMG;
}

function formatTripCardMeta(trip: Trip): string {
  const start = new Date(trip.dates.start + "T12:00:00");
  const end = new Date(trip.dates.end + "T12:00:00");
  const range = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const statusLabel =
    trip.status === "draft"
      ? "Draft"
      : trip.status === "voting"
        ? "Voting"
        : trip.status === "planning"
          ? "Planning"
          : trip.status === "active"
            ? "Active"
            : trip.status === "completed"
              ? "Completed"
              : trip.status;
  return `${statusLabel} · ${range}`;
}

// ─── Avatar colours keyed by initials ────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: "#FDDFD4", color: "#C44B29" },
  { bg: "#D4EAE3", color: "#1E5A44" },
  { bg: "#F5ECD4", color: "#8A6020" },
  { bg: "#EAD4F5", color: "#6B2D8A" },
  { bg: "#D4E8F5", color: "#1E5A8A" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarStack({ initials, size = 26 }: { initials: string[]; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {initials.map((ini, i) => {
        const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: pal.bg,
              border: "2px solid rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: i === 0 ? 0 : -(size * 0.35),
              zIndex: initials.length - i,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: size * 0.38,
                fontWeight: 600,
                color: pal.color,
                letterSpacing: "-0.2px",
              }}
            >
              {ini}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ label, variant = "white" }: { label: string; variant?: "white" | "coral" | "sage" }) {
  const styles: Record<string, React.CSSProperties> = {
    white: {
      background: "rgba(255,255,255,0.20)",
      border: "1px solid rgba(255,255,255,0.35)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: "white",
    },
    coral: { background: `${CORAL}22`, border: `1px solid ${CORAL}55`, color: CORAL },
    sage:  { background: `${SAGE}18`,  border: `1px solid ${SAGE}44`,  color: SAGE  },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 99,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
    >
      {label}
    </span>
  );
}

// Nav icons
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z"
        fill={active ? CORAL : "none"}
        stroke={active ? CORAL : "#B0A99F"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 20v-7h6v7" stroke={active ? "white" : "#B0A99F"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCompass() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8.5" stroke="#B0A99F" strokeWidth="1.6" />
      <path d="M14.5 7.5l-2 4.5-4.5 2 2-4.5 4.5-2z" stroke="#B0A99F" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="1" fill="#B0A99F" />
    </svg>
  );
}
function IconImport() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8.5" stroke="#B0A99F" strokeWidth="1.6" />
      <path d="M11 7.5v7M7.5 11h7" stroke="#B0A99F" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8.5" r="3.5" stroke="#B0A99F" strokeWidth="1.6" />
      <path d="M4.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="#B0A99F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ─── Trip card from store (Your Trips strip) ─────────────────────────────────

function StoreTripCard({
  trip,
  isActive,
  onSelect,
  delay,
  visible,
}: {
  trip: Trip;
  isActive: boolean;
  onSelect: () => void;
  delay: number;
  visible: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const image = coverImageForTrip(trip);
  const avatars = trip.members.map((m) => m.initials).slice(0, 4);
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: 160,
        height: 120,
        borderRadius: 14,
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        cursor: "pointer",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        transition: `transform 0.14s ease, opacity 0.44s ease ${delay}s, box-shadow 0.14s ease`,
        opacity: visible ? 1 : 0,
        border: "none",
        padding: 0,
        display: "block",
        textAlign: "left" as const,
        boxShadow: isActive
          ? `0 0 0 2px ${CORAL}, 0 4px 18px rgba(232,93,58,0.22)`
          : pressed
            ? "0 2px 10px rgba(0,0,0,0.10)"
            : "0 4px 18px rgba(0,0,0,0.10)",
      }}
    >
      <img
        src={image}
        alt={trip.destination}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "10px 11px 11px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <AvatarStack initials={avatars.length ? avatars : ["S"]} size={22} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 17,
              color: "white",
              lineHeight: 1.1,
              marginBottom: 3,
              letterSpacing: "-0.1px",
            }}
          >
            {trip.destination}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10.5,
              color: "rgba(255,255,255,0.68)",
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            {formatTripCardMeta(trip)}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface HomeScreenProps {
  onOpenTrip: (tripId: string) => void;
  onOpenImport?: (tripId: string) => void;
  onCreateTrip?: (tripId: string) => void;
  onOpenProfile?: () => void;
}

export function HomeScreen({ onOpenTrip, onOpenImport, onCreateTrip, onOpenProfile }: HomeScreenProps) {
  const [visible, setVisible]         = useState(false);
  const [heroPressed, setHeroPressed] = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const trips = useTripStore((s) => s.trips);
  const currentTripId = useTripStore((s) => s.currentTripId);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const displayName = useTripStore((s) => s.userProfile.displayName);

  const greetingFirst = useMemo(() => {
    const t = displayName.trim();
    if (!t) return "there";
    return t.split(/\s+/)[0] ?? "there";
  }, [displayName]);

  const avatarInitial = useMemo(() => {
    const ch = displayName.trim().charAt(0).toUpperCase();
    return ch || "S";
  }, [displayName]);

  const activeTrip = useMemo(() => {
    const direct = trips.find((t) => t.id === currentTripId);
    if (direct) return direct;
    const seed = trips.find((t) => t.id === SEED_TRIP.id);
    if (seed) return seed;
    return trips[0] ?? null;
  }, [trips, currentTripId]);

  const tripsForList = useMemo(() => {
    const seed = trips.find((t) => t.id === SEED_TRIP.id);
    const rest = trips.filter((t) => t.id !== SEED_TRIP.id);
    return seed ? [seed, ...rest] : [...trips];
  }, [trips]);

  useEffect(() => {
    if (!trips.length) return;
    const direct = trips.find((t) => t.id === currentTripId);
    if (!direct) {
      const seed = trips.find((t) => t.id === SEED_TRIP.id);
      setCurrentTrip(seed?.id ?? trips[0].id);
    }
  }, [trips, currentTripId, setCurrentTrip]);

  const openActivePlan = () => {
    const id = activeTrip?.id;
    if (!id) return;
    setCurrentTrip(id);
    onOpenTrip(id);
  };

  const openActiveImport = () => {
    const id = activeTrip?.id;
    if (!id) return;
    setCurrentTrip(id);
    onOpenImport?.(id);
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const stagger = (i: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.44s ease ${i * 0.07}s, transform 0.44s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s`,
  });

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
      <style>{`
        @keyframes ws-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ws-hero {
          from { opacity: 0; transform: scale(0.985) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ws-badge-pop {
          0%   { opacity: 0; transform: scale(0.8); }
          60%  { transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        .ws-hero-in    { animation: ws-hero    0.58s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
        .ws-badge-pop  { animation: ws-badge-pop 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.52s both; }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── SCROLLABLE BODY ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: 88,
        } as React.CSSProperties}
      >
        {/* ── TOP BAR ── */}
        <div
          style={{
            padding: "54px 22px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            ...stagger(0),
          }}
        >
          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Logomark: two overlapping circles */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="9"  cy="12" r="8" fill={CORAL}   opacity="0.90" />
              <circle cx="16" cy="12" r="8" fill={SAGE}    opacity="0.75" />
            </svg>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 20,
                color: DARK,
                letterSpacing: "-0.3px",
                lineHeight: 1,
              }}
            >
              WanderSync
            </span>
          </div>

          {/* User avatar */}
          <button
            type="button"
            onClick={() => onOpenProfile?.()}
            aria-label="Open profile"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FDDFD4 0%, #F5D0C0 100%)",
              border: `2.5px solid ${CORAL}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: onOpenProfile ? "pointer" : "default",
              boxShadow: "0 2px 8px rgba(232,93,58,0.18)",
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: CORAL,
                letterSpacing: "-0.2px",
              }}
            >
              {avatarInitial}
            </span>
          </button>
        </div>

        {/* ── GREETING ── */}
        <div
          style={{
            padding: "20px 22px 0",
            ...stagger(1),
          }}
        >
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 28,
              color: DARK,
              margin: "0 0 4px 0",
              lineHeight: 1.2,
              letterSpacing: "-0.4px",
            }}
          >
            Hey {greetingFirst} 👋
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: "#9A9080",
              margin: 0,
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            Where to next?
          </p>
        </div>

        {/* ── ACTIVE TRIP HERO CARD ── */}
        <div
          className="ws-hero-in"
          style={{ padding: "18px 22px 0" }}
        >
          <div
            onMouseDown={() => setHeroPressed(true)}
            onMouseUp={() => { setHeroPressed(false); openActivePlan(); }}
            onMouseLeave={() => setHeroPressed(false)}
            onTouchStart={() => setHeroPressed(true)}
            onTouchEnd={() => { setHeroPressed(false); openActivePlan(); }}
            style={{
              height: 210,
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              transform: heroPressed ? "scale(0.985)" : "scale(1)",
              transition: "transform 0.16s cubic-bezier(0.22,1,0.36,1), box-shadow 0.16s ease",
              boxShadow: heroPressed
                ? "0 4px 20px rgba(0,0,0,0.12)"
                : "0 8px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* Background image */}
            <img
              src={activeTrip ? coverImageForTrip(activeTrip) : TOKYO_IMG}
              alt={activeTrip?.destination ?? "Trip"}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 55%",
                display: "block",
                transform: heroPressed ? "scale(1.025)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            />

            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.10) 35%, rgba(0,0,0,0.72) 100%)",
              }}
            />

            {/* Coral tint streak top-right */}
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${CORAL}28 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* Content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "16px 18px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top row: active badge */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                  className="ws-badge-pop"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 99,
                    background: "rgba(0,0,0,0.30)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#6EE7A8",
                      boxShadow: "0 0 0 2.5px rgba(110,231,168,0.28)",
                      animation: "ws-badge-pop 2.2s ease-in-out infinite",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.92)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>

              {/* Bottom: trip info */}
              <div>
                {/* Trip name */}
                <h2
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 30,
                    color: "white",
                    margin: "0 0 4px 0",
                    lineHeight: 1.1,
                    letterSpacing: "-0.4px",
                    textShadow: "0 2px 16px rgba(0,0,0,0.4)",
                  }}
                >
                  {activeTrip?.destination ?? "Your"} Adventure
                </h2>

                {/* Date range */}
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12.5,
                    color: "rgba(255,255,255,0.72)",
                    margin: "0 0 14px 0",
                    fontWeight: 400,
                    letterSpacing: "0.02em",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="1" y="2" width="9" height="8" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.1" />
                    <path d="M1 5h9" stroke="rgba(255,255,255,0.6)" strokeWidth="1.1" />
                    <path d="M3.5 1v2M7.5 1v2" stroke="rgba(255,255,255,0.6)" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                  {activeTrip
                    ? `${new Date(activeTrip.dates.start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(activeTrip.dates.end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${new Date(activeTrip.dates.start).getFullYear()}`
                    : "Pick dates when you create a trip"}
                </p>

                {/* Bottom row: avatars + vote pill */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AvatarStack initials={activeTrip?.members.map(m => m.initials) ?? ["S"]} size={28} />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.60)",
                        fontWeight: 400,
                      }}
                    >
                      {activeTrip?.members.length ?? 0} travellers
                    </span>
                  </div>

                  <StatusPill
                    label={
                      activeTrip
                        ? `${activeTrip.rankings.length} of ${activeTrip.members.length} voted`
                        : "No trip yet"
                    }
                    variant="white"
                  />
                </div>
              </div>
            </div>

            {/* Tap ripple hint: subtle chevron right */}
            <div
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: heroPressed ? 0 : 0.4,
                transition: "opacity 0.2s ease",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── YOUR TRIPS HEADER ── */}
        <div
          style={{
            padding: "26px 22px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            ...stagger(3),
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#9A9080",
              textTransform: "uppercase",
            }}
          >
            Your Trips
          </span>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: CORAL,
              padding: "2px 0",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onClick={() => setCreateOpen(true)}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: `${CORAL}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              +
            </span>
            New Trip
          </button>
        </div>

        {/* ── PAST TRIPS HORIZONTAL SCROLL ── */}
        <div
          style={{
            paddingLeft: 22,
            paddingRight: 0,
            ...stagger(4),
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingRight: 22,
              paddingBottom: 4,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            } as React.CSSProperties}
          >
            {tripsForList.map((trip, i) => (
              <StoreTripCard
                key={trip.id}
                trip={trip}
                isActive={trip.id === currentTripId}
                onSelect={() => setCurrentTrip(trip.id)}
                delay={0.18 + i * 0.07}
                visible={visible}
              />
            ))}

            {/* "More" ghost card */}
            <div
              onClick={() => setCreateOpen(true)}
              style={{
                width: 100,
                height: 120,
                borderRadius: 14,
                flexShrink: 0,
                border: "1.5px dashed #DDD9D4",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                opacity: visible ? 1 : 0,
                transition: `opacity 0.44s ease 0.34s`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#F0EDE9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="#B0A99F" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10.5,
                  color: "#B0A99F",
                  fontWeight: 500,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                New<br />Trip
              </span>
            </div>
          </div>
        </div>

        {/* ── EMPTY STATE CTA ── */}
        <div
          style={{
            padding: "18px 22px 4px",
            ...stagger(5),
          }}
        >
          <div
            onClick={() => setCreateOpen(true)}
            style={{
              border: "1.8px dashed #D8D4CE",
              borderRadius: 16,
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              background: "rgba(255,255,255,0.50)",
              transition: "background 0.18s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.50)")}
          >
            {/* Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${CORAL}18 0%, ${CORAL}0A 100%)`,
                border: `1.5px solid ${CORAL}28`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke={CORAL} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 17,
                color: DARK,
                letterSpacing: "-0.1px",
              }}
            >
              Start a new trip
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12.5,
                color: "#A09888",
                fontWeight: 400,
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: 240,
              }}
            >
              Paste TikToks, add friends, and build your itinerary
            </span>
          </div>
        </div>

        {/* ── RECENT ACTIVITY FEED ── */}
        <div
          style={{
            padding: "20px 22px 4px",
            ...stagger(6),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#9A9080",
                textTransform: "uppercase",
              }}
            >
              Recent Activity
            </span>
          </div>

          {[
            { avatar: "M", name: "Marcus", action: "voted on", trip: "Tokyo Adventure", time: "2m ago", pal: AVATAR_PALETTES[1] },
            { avatar: "J", name: "Jess",   action: "added",    trip: "Shibuya Crossing", time: "1h ago", pal: AVATAR_PALETTES[3] },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 0",
                borderBottom: i === 0 ? "1px solid #EDE9E4" : "none",
                opacity: visible ? 1 : 0,
                transition: `opacity 0.4s ease ${0.5 + i * 0.08}s`,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: item.pal.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: item.pal.color }}>
                  {item.avatar}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: "#4A4540",
                    fontWeight: 500,
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: "#9A9080",
                    fontWeight: 400,
                  }}
                >
                  {" "}{item.action}{" "}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: CORAL,
                    fontWeight: 600,
                  }}
                >
                  {item.trip}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  color: "#C5BEB6",
                  fontWeight: 400,
                  flexShrink: 0,
                }}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 82,
          background: "rgba(250,250,248,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: 16,
          zIndex: 20,
        }}
      >
        {[
          { icon: <IconHome active />,    label: "Home",    active: true,  onClick: undefined },
          { icon: <IconCompass />,         label: "Explore", active: false, onClick: undefined },
          { icon: <IconImport />,          label: "Import",  active: false, onClick: openActiveImport },
          { icon: <IconProfile />,         label: "Profile", active: false, onClick: onOpenProfile },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={tab.onClick}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 14px",
              WebkitTapHighlightColor: "transparent",
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

      {/* ── CREATE TRIP SHEET ── */}
      {createOpen && (
        <CreateTripSheet
          onClose={() => setCreateOpen(false)}
          onCreate={(tripId) => { setCreateOpen(false); (onCreateTrip ?? onOpenImport ?? onOpenTrip)(tripId); }}
        />
      )}
    </div>
  );
}