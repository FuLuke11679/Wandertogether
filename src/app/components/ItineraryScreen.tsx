import { useState, useEffect } from "react";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";
const SAGE = "#2D5F4E";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Food:       { bg: "#FFF0EB", text: "#C44B29" },
  Culture:    { bg: "#F0EEF8", text: "#5A4D8A" },
  Experience: { bg: "#EBF5FF", text: "#2D6FA3" },
  Art:        { bg: "#FFF8EB", text: "#A06B20" },
  Nightlife:  { bg: "#F8EBF5", text: "#8A3A72" },
  Nature:     { bg: "#F0F8F0", text: "#2D6B3A" },
};

interface Stop {
  id: number;
  startTime: string;
  endTime: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  groupPickRank?: number;
  transitNext?: { mode: string; duration: string };
}

const STOPS: Stop[] = [
  {
    id: 1,
    startTime: "9:00 AM",
    endTime: "10:15 AM",
    name: "Senso-ji Temple",
    description: "Tokyo's oldest Buddhist temple — lanterns, incense & morning calm",
    category: "Culture",
    emoji: "⛩️",
    groupPickRank: 1,
    transitNext: { mode: "🚶", duration: "12 min walk" },
  },
  {
    id: 2,
    startTime: "10:30 AM",
    endTime: "12:00 PM",
    name: "Tsukiji Outer Market",
    description: "Street-side sushi, tamagoyaki & fresh vendor stalls at their peak",
    category: "Food",
    emoji: "🍜",
    groupPickRank: 2,
    transitNext: { mode: "🚇", duration: "18 min metro" },
  },
  {
    id: 3,
    startTime: "1:00 PM",
    endTime: "3:00 PM",
    name: "teamLab Borderless",
    description: "Immersive digital art worlds — allow yourself to get wonderfully lost",
    category: "Art",
    emoji: "🎨",
    transitNext: { mode: "🚕", duration: "22 min taxi" },
  },
  {
    id: 4,
    startTime: "3:30 PM",
    endTime: "4:45 PM",
    name: "Meiji Shrine",
    description: "Tranquil forested Shinto shrine set deep in Harajuku's ancient woods",
    category: "Culture",
    emoji: "⛩️",
  },
];

// ─── Styled Map ──────────────────────────────────────────────────────────────

function TokyoMap() {
  // Pin positions for a 390×270 viewBox
  const pins = [
    { x: 298, y: 62,  label: "1", area: "Asakusa" },   // Senso-ji (NE)
    { x: 248, y: 138, label: "2", area: "Tsukiji" },    // Tsukiji (central)
    { x: 316, y: 215, label: "3", area: "Toyosu" },     // teamLab (SE)
    { x: 96,  y: 150, label: "4", area: "Harajuku" },   // Meiji (W)
    { x: 155, y: 84,  label: "5", area: "" },            // Dinner / future (NW)
  ];

  // Smooth cubic bezier path through stops 1→2→3→4→5
  const routeD = `
    M 298,62
    C 274,100 261,118 248,138
    C 280,175 300,196 316,215
    C 210,222 152,198 96,150
    C 122,118 138,100 155,84
  `;

  return (
    <svg
      width="390"
      height="270"
      viewBox="0 0 390 270"
      style={{ display: "block" }}
    >
      {/* === BACKGROUND === */}
      <rect width="390" height="270" fill="#ECE8DE" />

      {/* === CITY BLOCK TEXTURE === */}
      {/* Major horizontal roads */}
      <line x1="0" y1="68" x2="390" y2="68" stroke="#D2CEC4" strokeWidth="4" />
      <line x1="0" y1="148" x2="390" y2="148" stroke="#D2CEC4" strokeWidth="4" />
      <line x1="0" y1="218" x2="390" y2="218" stroke="#D2CEC4" strokeWidth="4" />

      {/* Major vertical roads */}
      <line x1="98" y1="0" x2="98" y2="270" stroke="#D2CEC4" strokeWidth="4" />
      <line x1="192" y1="0" x2="192" y2="270" stroke="#D2CEC4" strokeWidth="4" />
      <line x1="288" y1="0" x2="288" y2="270" stroke="#D2CEC4" strokeWidth="4" />

      {/* Minor horizontal roads */}
      <line x1="0" y1="30" x2="390" y2="30" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="0" y1="108" x2="390" y2="108" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="0" y1="178" x2="390" y2="178" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="0" y1="248" x2="390" y2="248" stroke="#D8D4CA" strokeWidth="1.2" />

      {/* Minor vertical roads */}
      <line x1="50" y1="0" x2="50" y2="270" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="145" y1="0" x2="145" y2="270" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="240" y1="0" x2="240" y2="270" stroke="#D8D4CA" strokeWidth="1.2" />
      <line x1="338" y1="0" x2="338" y2="270" stroke="#D8D4CA" strokeWidth="1.2" />

      {/* Diagonal roads (gives Tokyo organic feel) */}
      <line x1="0"   y1="108" x2="98"  y2="0"   stroke="#D5D1C7" strokeWidth="1.5" />
      <line x1="192" y1="270" x2="390" y2="178"  stroke="#D5D1C7" strokeWidth="1.5" />
      <line x1="98"  y1="270" x2="288" y2="148"  stroke="#D5D1C7" strokeWidth="1.2" />
      <line x1="145" y1="0"   x2="288" y2="68"   stroke="#D5D1C7" strokeWidth="1.0" />

      {/* === SUMIDA RIVER (right side, S-curve) === */}
      <path
        d="M 316 0 C 326 45 298 88 312 148 C 326 205 298 240 318 270"
        stroke="#B4CADB" strokeWidth="9" fill="none" opacity="0.75"
      />

      {/* === TOKYO BAY (bottom-right corner) === */}
      <path
        d="M 330 252 Q 372 258 390 270 L 390 270 L 330 270 Z"
        fill="#B4CADB" opacity="0.85"
      />

      {/* === PARKS === */}
      {/* Yoyogi / Shinjuku Gyoen (lower-left area) */}
      <rect x="24" y="158" width="62" height="50" rx="5" fill="#B8D09C" opacity="0.52" />
      {/* Ueno Park (upper-right area) */}
      <rect x="300" y="14" width="50" height="42" rx="4" fill="#B8D09C" opacity="0.42" />

      {/* Park label texture stripes (subtle) */}
      <line x1="24" y1="170" x2="86" y2="170" stroke="#A8C08C" strokeWidth="0.8" opacity="0.4" />
      <line x1="24" y1="180" x2="86" y2="180" stroke="#A8C08C" strokeWidth="0.8" opacity="0.4" />
      <line x1="24" y1="190" x2="86" y2="190" stroke="#A8C08C" strokeWidth="0.8" opacity="0.4" />

      {/* === AREA LABELS === */}
      <text x="302" y="126" fontSize="7.5" fill="#B8B2A8" fontFamily="'Inter', sans-serif" fontWeight="500" opacity="0.8">
        ASAKUSA
      </text>
      <text x="60" y="165" fontSize="7" fill="#B8B2A8" fontFamily="'Inter', sans-serif" fontWeight="500" opacity="0.7">
        HARAJUKU
      </text>
      <text x="198" y="165" fontSize="7" fill="#B8B2A8" fontFamily="'Inter', sans-serif" fontWeight="500" opacity="0.7">
        CENTRAL
      </text>

      {/* === ROUTE PATH (dashed sage line) === */}
      {/* Shadow/glow pass */}
      <path
        d={routeD}
        stroke="#2D5F4E"
        strokeWidth="5"
        fill="none"
        strokeDasharray="9,6"
        strokeLinecap="round"
        opacity="0.12"
      />
      {/* Main route */}
      <path
        d={routeD}
        stroke={SAGE}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="9,6"
        strokeLinecap="round"
      />

      {/* === PIN HALOS (soft white glow) === */}
      {pins.map((pin, i) => (
        <circle key={`halo-${i}`} cx={pin.x} cy={pin.y} r="18" fill="white" opacity="0.35" />
      ))}

      {/* === PINS === */}
      {pins.map((pin, i) => {
        const isConfirmed = i < 4;
        return (
          <g key={`pin-${i}`}>
            {/* Drop shadow */}
            <circle cx={pin.x + 1} cy={pin.y + 2} r={isConfirmed ? 13 : 10} fill="rgba(0,0,0,0.12)" />
            {/* Pin body */}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isConfirmed ? 13 : 10}
              fill={isConfirmed ? CORAL : "white"}
              stroke={!isConfirmed ? CORAL : "none"}
              strokeWidth={!isConfirmed ? 2 : 0}
              opacity={isConfirmed ? 1 : 0.8}
            />
            {/* Pin number */}
            <text
              x={pin.x}
              y={pin.y + 4}
              textAnchor="middle"
              fontSize={isConfirmed ? 11 : 10}
              fontWeight="700"
              fill={isConfirmed ? "white" : CORAL}
              fontFamily="'Inter', sans-serif"
              opacity={isConfirmed ? 1 : 0.8}
            >
              {pin.label}
            </text>
          </g>
        );
      })}

      {/* === COMPASS ROSE (bottom-left) === */}
      <g transform="translate(22, 248)" opacity="0.55">
        <circle r="11" fill="white" opacity="0.8" />
        <text x="0" y="-3" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#8A8278" fontFamily="'Inter', sans-serif">N</text>
        <line x1="0" y1="-8" x2="0" y2="-1" stroke="#C44B29" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="1" x2="0" y2="8" stroke="#B8B2A8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke="#B8B2A8" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* === BOTTOM FADE (blends into timeline) === */}
      <defs>
        <linearGradient id="mapGradFade" x1="0" x2="0" y1="0.6" y2="1">
          <stop offset="0%" stopColor="#ECE8DE" stopOpacity="0" />
          <stop offset="100%" stopColor={BG} stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="390" height="270" fill="url(#mapGradFade)" />
    </svg>
  );
}

// ─── Timeline Card ────────────────────────────────────────────────────────────

function StopCard({ stop, index, visible }: { stop: Stop; index: number; visible: boolean }) {
  const catColors = CATEGORY_COLORS[stop.category] ?? { bg: "#F5F3F0", text: "#666" };
  const delay = index * 0.1;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.46s ease ${delay}s, transform 0.46s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          padding: "14px 14px 13px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          marginLeft: 12,
        }}
      >
        {/* Time range */}
        <div style={{ marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
              fontSize: 10.5,
              color: CORAL,
              letterSpacing: "0.04em",
              fontWeight: 600,
            }}
          >
            {stop.startTime} — {stop.endTime}
          </span>
        </div>

        {/* Activity name */}
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 17,
            fontWeight: 600,
            color: DARK,
            margin: "0 0 5px 0",
            lineHeight: 1.2,
            letterSpacing: "-0.2px",
          }}
        >
          {stop.name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: "#8A8278",
            margin: "0 0 10px 0",
            lineHeight: 1.45,
            fontWeight: 400,
          }}
        >
          {stop.description}
        </p>

        {/* Badges row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {/* Category badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 9px",
              borderRadius: 99,
              background: catColors.bg,
              color: catColors.text,
              fontSize: 10.5,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 11 }}>{stop.emoji}</span>
            {stop.category}
          </span>

          {/* Group Pick badge (first item only) */}
          {stop.groupPickRank === 1 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: 99,
                background: "#FFF0EB",
                border: `1px solid ${CORAL}44`,
                color: "#C44B29",
                fontSize: 10.5,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              🔥 #1 Group Pick
            </span>
          )}
          {stop.groupPickRank === 2 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 9px",
                borderRadius: 99,
                background: "#F5F3F0",
                color: "#8A8278",
                fontSize: 10.5,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              ✦ #2 Group Pick
            </span>
          )}
        </div>
      </div>

      {/* Transit indicator */}
      {stop.transitNext && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 0 10px 12px",
            opacity: visible ? 1 : 0,
            transition: `opacity 0.4s ease ${delay + 0.15}s`,
          }}
        >
          <span style={{ fontSize: 13 }}>{stop.transitNext.mode}</span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11.5,
              color: "#A09890",
              fontWeight: 400,
              letterSpacing: "0.01em",
            }}
          >
            {stop.transitNext.duration}
          </span>
          {/* Dashed line */}
          <div
            style={{
              flex: 1,
              height: 1,
              background: `repeating-linear-gradient(90deg, #DDD9D4 0px, #DDD9D4 4px, transparent 4px, transparent 10px)`,
              opacity: 0.7,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface ItineraryScreenProps {
  onBack: () => void;
  onStartDay: () => void;
}

export function ItineraryScreen({ onBack, onStartDay }: ItineraryScreenProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const days = [
    { n: 1, label: "Day 1", date: "Mar 22" },
    { n: 2, label: "Day 2", date: "Mar 23" },
    { n: 3, label: "Day 3", date: "Mar 24" },
  ];

  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: BG,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .topbar-in { animation: slide-down 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div
        className="topbar-in"
        style={{
          padding: "48px 20px 10px",
          flexShrink: 0,
          background: BG,
          zIndex: 10,
        }}
      >
        {/* Row 1: back + title + group avatars */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B6258" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Date heading */}
          <div style={{ flex: 1, marginLeft: 6 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  color: DARK,
                  letterSpacing: "-0.2px",
                }}
              >
                Day {selectedDay}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C5BEB6", display: "inline-block", marginBottom: 2 }} />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: "#8A8278",
                  fontWeight: 400,
                }}
              >
                March {21 + selectedDay}, 2026
              </span>
            </div>
          </div>

          {/* Group member count pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 99,
              background: "#F3F1EE",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="4.5" cy="4" r="2" fill="#A09890" />
              <circle cx="8" cy="4" r="2" fill="#A09890" />
              <path d="M1 10c0-1.8 1.6-3 3.5-3" stroke="#A09890" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M11 10c0-1.8-1.6-3-3.5-3" stroke="#A09890" strokeWidth="1.1" strokeLinecap="round" />
              <path d="M4.5 7c0-1.8 1.6-3 3.5-3S11 5.2 11 7" stroke="#A09890" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#8A8278", fontWeight: 500 }}>
              4 going
            </span>
          </div>
        </div>

        {/* Row 2: Day pills */}
        <div style={{ display: "flex", gap: 7 }}>
          {days.map((d) => {
            const isSelected = selectedDay === d.n;
            return (
              <button
                key={d.n}
                onClick={() => setSelectedDay(d.n)}
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "5px 14px 6px",
                  borderRadius: 10,
                  border: isSelected ? `2px solid ${CORAL}` : "1.5px solid #E2DDD8",
                  background: isSelected ? CORAL : "transparent",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  WebkitTapHighlightColor: "transparent",
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: isSelected ? "white" : "#5A5248",
                    letterSpacing: "0.01em",
                  }}
                >
                  {d.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9.5,
                    color: isSelected ? "rgba(255,255,255,0.8)" : "#B0A99F",
                    fontWeight: 400,
                    letterSpacing: "0.02em",
                  }}
                >
                  {d.date}
                </span>
              </button>
            );
          })}

          {/* Stats pill */}
          <div
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 10,
              background: "#F3F1EE",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="#A09890" strokeWidth="1.1" />
              <path d="M5.5 3V5.5L7 7" stroke="#A09890" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#8A8278", fontWeight: 500 }}>
              7.5 hrs
            </span>
          </div>
        </div>
      </div>

      {/* ── MAP AREA ── */}
      <div
        style={{
          height: 270,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <TokyoMap />
      </div>

      {/* ── SCROLLABLE TIMELINE ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 110,
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {/* Timeline header */}
        <div
          style={{
            padding: "16px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.4s ease 0.05s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 12 }}>✦</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.10em",
                color: "#9A9080",
                textTransform: "uppercase",
              }}
            >
              Your Itinerary
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: 12,
              color: "#B0A99F",
            }}
          >
            4 stops · Tokyo
          </span>
        </div>

        {/* ── VERTICAL TIMELINE ── */}
        <div style={{ padding: "0 20px 0 20px", position: "relative" }}>
          {/* Continuous vertical line */}
          <div
            style={{
              position: "absolute",
              left: 28,           // 20px outer padding + 8px to center
              top: 8,
              bottom: 60,
              width: 1.5,
              background: "linear-gradient(to bottom, #E2DDD8 0%, #EAE6E0 100%)",
              zIndex: 0,
              opacity: visible ? 1 : 0,
              transition: "opacity 0.5s ease 0.2s",
            }}
          />

          {STOPS.map((stop, index) => (
            <div key={stop.id} style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
              {/* Timeline node column */}
              <div
                style={{
                  width: 16,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingTop: 14,
                  zIndex: 1,
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.4s ease ${index * 0.1 + 0.1}s`,
                }}
              >
                {/* Circle node */}
                <div
                  style={{
                    width: stop.id === 1 ? 14 : 10,
                    height: stop.id === 1 ? 14 : 10,
                    borderRadius: "50%",
                    background: stop.id === 1 ? CORAL : "#FFFFFF",
                    border: stop.id === 1 ? `3px solid ${CORAL}` : "2px solid #C5BEB6",
                    boxShadow: stop.id === 1
                      ? `0 0 0 3px rgba(232,93,58,0.18)`
                      : "none",
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                />
              </div>

              {/* Card + transit container */}
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <StopCard stop={stop} index={index} visible={visible} />
              </div>
            </div>
          ))}

          {/* End node */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              paddingTop: 2,
              opacity: visible ? 1 : 0,
              transition: "opacity 0.4s ease 0.55s",
            }}
          >
            <div style={{ width: 16, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#EAE6E0",
                  border: "1.5px solid #D5D1CC",
                  zIndex: 2,
                }}
              />
            </div>
            <div style={{ marginLeft: 12 }}>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "#C5BEB6",
                }}
              >
                End of day — enjoy the evening ✦
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM BUTTON ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 20px 36px",
          background: `linear-gradient(to top, ${BG} 70%, transparent 100%)`,
          zIndex: 20,
        }}
      >
        <button
          onClick={onStartDay}
          style={{
            width: "100%",
            background: CORAL,
            border: "none",
            borderRadius: 14,
            padding: "16px 24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 20px rgba(232, 93, 58, 0.30)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(232,93,58,0.22)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(232,93,58,0.30)";
          }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              letterSpacing: "0.01em",
            }}
          >
            Start This Day
          </span>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }}>→</span>
        </button>
      </div>
    </div>
  );
}