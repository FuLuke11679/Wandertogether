import { useState, useEffect, useRef } from "react";
import { useTripStore } from "../../lib/store";

const CORAL = "#E85D3A";
const DARK  = "#1A1A1A";
const BG    = "#FAFAF8";

// ─── Data ────────────────────────────────────────────────────────────────────

const REASONS = [
  { id: "late",    label: "Running late",    emoji: "⏰", tint: "#FFF3E0", border: "#FFDCAD" },
  { id: "weather", label: "Weather changed", emoji: "🌧️", tint: "#E3F2FD", border: "#AACDE8" },
  { id: "tired",   label: "I'm tired",       emoji: "😴", tint: "#F3E5F5", border: "#D8BDED" },
  { id: "other",   label: "Something else",  emoji: "✏️", tint: "#F5F3F0", border: "#DDD9D4" },
];

// AI suggestion copy keyed to reason
const AI_MESSAGES: Record<string, string> = {
  late:    "You're running behind by about 30 min. I've trimmed two stops and optimised transit routes so you still hit the highlights.",
  weather: "It started raining in Shibuya. I've swapped your 2 outdoor stops for indoor alternatives nearby.",
  tired:   "Totally fair — long day! I've removed one stop and added a relaxed café break so you can recharge.",
  other:   "Got it. I've lightened the afternoon and left room to improvise. Your must-dos are still locked in.",
};

interface CompStop {
  id: string;
  wasName: string;
  nowName: string;
  changed: boolean;
  emoji: string;
}

const STOPS: CompStop[] = [
  { id: "1", wasName: "Meiji Shrine",          nowName: "Shibuya 109 Shopping", changed: true,  emoji: "⛩️" },
  { id: "2", wasName: "Yoyogi Park",            nowName: "Cat Café Mocha",       changed: true,  emoji: "🌿" },
  { id: "3", wasName: "Shinjuku Gyoen",         nowName: "Shinjuku Gyoen",       changed: false, emoji: "🎋" },
  { id: "4", wasName: "Golden Gai",             nowName: "Golden Gai",           changed: false, emoji: "🍸" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReasonCard({
  reason,
  selected,
  onSelect,
  delay,
  sheetVisible,
}: {
  reason: typeof REASONS[0];
  selected: boolean;
  onSelect: () => void;
  delay: number;
  sheetVisible: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => { setPressed(false); onSelect(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onSelect(); }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "12px 13px",
        borderRadius: 14,
        background: selected ? reason.tint : "#FFFFFF",
        border: selected
          ? `2px solid ${CORAL}`
          : `1.5px solid ${reason.border}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        boxShadow: selected
          ? `0 0 0 4px rgba(232,93,58,0.10), 0 2px 10px rgba(0,0,0,0.05)`
          : "0 1px 4px rgba(0,0,0,0.04)",
        opacity: sheetVisible ? 1 : 0,
        transitionDelay: `${delay}s`,
        WebkitTapHighlightColor: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Selected tick */}
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: CORAL,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <span style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{reason.emoji}</span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12.5,
          fontWeight: 600,
          color: selected ? DARK : "#5A5248",
          letterSpacing: "-0.1px",
          lineHeight: 1.25,
        }}
      >
        {reason.label}
      </span>
    </button>
  );
}

function ComparisonRow({ stop, sheetVisible, delay }: { stop: CompStop; sheetVisible: boolean; delay: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        opacity: sheetVisible ? 1 : 0,
        transform: sheetVisible ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.36s ease ${delay}s, transform 0.36s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
      }}
    >
      {/* WAS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 10px",
          borderRadius: 10,
          background: stop.changed ? "rgba(0,0,0,0.025)" : "#F7F5F2",
          opacity: stop.changed ? 0.45 : 1,
        }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>{stop.emoji}</span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11.5,
            fontWeight: 500,
            color: stop.changed ? "#7A7268" : "#4A4540",
            textDecoration: stop.changed ? "line-through" : "none",
            textDecorationColor: "#A09888",
            lineHeight: 1.3,
            letterSpacing: "-0.1px",
          }}
        >
          {stop.wasName}
        </span>
      </div>

      {/* NOW */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 10px",
          borderRadius: 10,
          background: stop.changed ? "rgba(45,95,78,0.06)" : "#F7F5F2",
          border: stop.changed ? "1px solid rgba(45,95,78,0.14)" : "none",
        }}
      >
        <span style={{ fontSize: 13, flexShrink: 0 }}>
          {stop.changed ? (stop.id === "1" ? "🛍️" : "🐱") : stop.emoji}
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11.5,
            fontWeight: stop.changed ? 600 : 500,
            color: stop.changed ? "#2D5F4E" : "#4A4540",
            lineHeight: 1.3,
            letterSpacing: "-0.1px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {stop.nowName}
        </span>
        {stop.changed && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: "#2D5F4E",
              background: "rgba(45,95,78,0.12)",
              padding: "2px 5px",
              borderRadius: 5,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            NEW
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

interface SalvageModeSheetProps {
  tripId: string;
  onClose: () => void;
  onAccept: () => void;
}

export function SalvageModeSheet({ tripId, onClose, onAccept }: SalvageModeSheetProps) {
  const [selected, setSelected]       = useState<string>("weather");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [accepted, setAccepted]       = useState(false);
  const [pressedBtn, setPressedBtn]   = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setSheetVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Reset scroll on reason change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [selected]);

  const handleAccept = () => {
    useTripStore.getState().applyFallbackSalvage(tripId);
    setAccepted(true);
    setTimeout(() => onAccept(), 700);
  };

  const handleClose = () => {
    setSheetVisible(false);
    setTimeout(() => onClose(), 340);
  };

  const sheetH = Math.round(844 * 0.81); // ~80%

  return (
    <>
      <style>{`
        @keyframes salvage-fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes salvage-accept {
          0%   { opacity: 0; transform: scale(0.85); }
          50%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        .accept-pop { animation: salvage-accept 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      {/* ── BACKDROP ── */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,8,6,0.52)",
          zIndex: 40,
          opacity: sheetVisible ? 1 : 0,
          transition: "opacity 0.32s ease",
          animation: "salvage-fade-in 0.01s both",
        }}
      />

      {/* ── SHEET ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: sheetH,
          background: BG,
          borderRadius: "20px 20px 0 0",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: sheetVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18), 0 -2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* ── DRAG HANDLE ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 6,
            flexShrink: 0,
            cursor: "grab",
          }}
          onClick={handleClose}
        >
          <div
            style={{
              width: 38,
              height: 4,
              borderRadius: 99,
              background: "#DDD9D3",
            }}
          />
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 16,
          } as React.CSSProperties}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              padding: "10px 22px 0",
              opacity: sheetVisible ? 1 : 0,
              transform: sheetVisible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.38s ease 0.06s, transform 0.38s cubic-bezier(0.22,1,0.36,1) 0.06s",
            }}
          >
            {/* Sparkle + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>✦</span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  color: CORAL,
                  textTransform: "uppercase",
                }}
              >
                Salvage Mode
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                fontWeight: 600,
                color: DARK,
                margin: "0 0 5px 0",
                lineHeight: 1.2,
                letterSpacing: "-0.3px",
              }}
            >
              Let's adjust your day
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "#8A8278",
                margin: 0,
                fontWeight: 400,
              }}
            >
              What happened?
            </p>
          </div>

          {/* ── REASON GRID ── */}
          <div
            style={{
              padding: "16px 22px 0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {REASONS.map((r, i) => (
              <ReasonCard
                key={r.id}
                reason={r}
                selected={selected === r.id}
                onSelect={() => setSelected(r.id)}
                delay={0.10 + i * 0.055}
                sheetVisible={sheetVisible}
              />
            ))}
          </div>

          {/* ── AI MESSAGE BOX ── */}
          <div
            style={{
              margin: "14px 22px 0",
              padding: "13px 15px",
              background: "#FFFFFF",
              borderRadius: 14,
              border: "1.5px solid #EDE9E4",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              opacity: sheetVisible ? 1 : 0,
              transform: sheetVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.38s ease 0.32s, transform 0.38s cubic-bezier(0.22,1,0.36,1) 0.32s",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {/* Orb icon */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #FFF0EB 0%, #FDDDD4 100%)",
                  border: "1.5px solid rgba(232,93,58,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5L8.5 5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5L2 5h3.5L7 1.5z" fill={CORAL} opacity="0.9" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: CORAL,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    WanderAI
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(232,93,58,0.10)",
                      color: CORAL,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                  >
                    LIVE
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: "#5A5248",
                    margin: 0,
                    lineHeight: 1.55,
                    fontWeight: 400,
                  }}
                >
                  {AI_MESSAGES[selected]}
                </p>
              </div>
            </div>
          </div>

          {/* ── BEFORE / AFTER COMPARISON ── */}
          <div
            style={{
              margin: "16px 22px 0",
              opacity: sheetVisible ? 1 : 0,
              transition: "opacity 0.38s ease 0.40s",
            }}
          >
            {/* Section label */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    color: "#B0A99F",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Was
                </span>
                <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    color: "#2D5F4E",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Now
                </span>
                <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
              </div>
            </div>

            {/* Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {STOPS.map((stop, i) => (
                <ComparisonRow
                  key={stop.id}
                  stop={stop}
                  sheetVisible={sheetVisible}
                  delay={0.42 + i * 0.06}
                />
              ))}
            </div>

            {/* Divider between changed + unchanged */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "10px 0",
                opacity: 0.6,
              }}
            >
              <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9.5,
                  color: "#C5BEB6",
                  letterSpacing: "0.08em",
                  flexShrink: 0,
                }}
              >
                2 stops unchanged
              </span>
              <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
            </div>
          </div>
        </div>

        {/* ── ACCEPT SUCCESS OVERLAY ── */}
        {accepted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(45,95,78,0.92)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              zIndex: 60,
              borderRadius: "20px 20px 0 0",
            }}
          >
            <div className="accept-pop">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="29" stroke="white" strokeWidth="1.5" opacity="0.3" />
                <circle cx="30" cy="30" r="22" fill="rgba(255,255,255,0.15)" />
                <path d="M19 30l8 8 14-14" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "white",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.2px",
                }}
              >
                New plan accepted!
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.72)",
                  margin: 0,
                }}
              >
                Updating your itinerary…
              </p>
            </div>
          </div>
        )}

        {/* ── STICKY BUTTONS ── */}
        <div
          style={{
            padding: "10px 22px 36px",
            background: BG,
            borderTop: "1px solid #EDE9E4",
            flexShrink: 0,
            opacity: sheetVisible ? 1 : 0,
            transform: sheetVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.38s ease 0.55s, transform 0.38s cubic-bezier(0.22,1,0.36,1) 0.55s",
          }}
        >
          {/* Accept */}
          <button
            onMouseDown={() => setPressedBtn("accept")}
            onMouseUp={() => { setPressedBtn(null); handleAccept(); }}
            onMouseLeave={() => setPressedBtn(null)}
            onTouchStart={() => setPressedBtn("accept")}
            onTouchEnd={() => { setPressedBtn(null); handleAccept(); }}
            style={{
              width: "100%",
              background: CORAL,
              border: "none",
              borderRadius: 14,
              padding: "15px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: pressedBtn === "accept"
                ? "0 2px 8px rgba(232,93,58,0.20)"
                : "0 4px 20px rgba(232,93,58,0.32)",
              transform: pressedBtn === "accept" ? "scale(0.98)" : "scale(1)",
              transition: "transform 0.12s ease, box-shadow 0.12s ease",
              WebkitTapHighlightColor: "transparent",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "white",
                letterSpacing: "0.01em",
              }}
            >
              Accept New Plan
            </span>
            <span style={{ fontSize: 15 }}>✓</span>
          </button>

          {/* Keep original */}
          <button
            onMouseDown={() => setPressedBtn("keep")}
            onMouseUp={() => { setPressedBtn(null); handleClose(); }}
            onMouseLeave={() => setPressedBtn(null)}
            onTouchStart={() => setPressedBtn("keep")}
            onTouchEnd={() => { setPressedBtn(null); handleClose(); }}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0",
              opacity: pressedBtn === "keep" ? 0.55 : 1,
              transition: "opacity 0.12s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontSize: 14,
                color: "#A09888",
                letterSpacing: "0.01em",
              }}
            >
              Keep original plan
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
