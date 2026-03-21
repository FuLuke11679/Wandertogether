import { useState, useEffect } from "react";

const CORAL   = "#E85D3A";
const SAGE    = "#2D5F4E";
const BG      = "#FAFAF8";
const DARK    = "#1A1A1A";

const HERO_IMAGE  = "https://images.unsplash.com/photo-1768141728185-c14bdfe90f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbW1lcnNpdmUlMjBkaWdpdGFsJTIwYXJ0JTIwaW5zdGFsbGF0aW9uJTIwZGFyayUyMGNvbG9yZnVsJTIwbGlnaHR8ZW58MXx8fHwxNzc0MDM0NzE3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const MEIJI_IMAGE = "https://images.unsplash.com/photo-1707836907233-07f01776ac18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNZWlqaSUyMHNocmluZSUyMGZvcmVzdCUyMHBhdGglMjBtb3JuaW5nJTIwbWlzdHxlbnwxfHx8fDE3NzQwMzQ3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080";

const TOTAL_STOPS     = 5;
const COMPLETED_STOPS = 2;
// teamLab ends at 3:00 PM; start simulated at 1:47 PM → 1h 13m left
const INITIAL_SECONDS = 1 * 3600 + 13 * 60;

// Remaining schedule
const UPCOMING = [
  { id: 4, name: "Meiji Shrine",   time: "3:30 PM", endTime: "4:45 PM", transit: "15 min transit",  category: "Culture",  emoji: "⛩️", location: "Harajuku, Tokyo" },
  { id: 5, name: "Golden Gai",     time: "7:00 PM", endTime: "10:00 PM", transit: "22 min taxi",    category: "Nightlife",emoji: "🍸", location: "Shinjuku, Tokyo" },
];

interface ExecutionScreenProps {
  onBack: () => void;
  onAdjust: () => void;
}

export function ExecutionScreen({ onBack, onAdjust }: ExecutionScreenProps) {
  const [countdown, setCountdown]   = useState(INITIAL_SECONDS);
  const [clockTime, setClockTime]   = useState(new Date());
  const [visible, setVisible]       = useState(false);
  const [doneState, setDoneState]   = useState<"idle" | "success">("idle");
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(s => Math.max(0, s - 1));
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const formatClock = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const formatCountdown = () => {
    const h = Math.floor(countdown / 3600);
    const m = Math.floor((countdown % 3600) / 60);
    const s = countdown % 60;
    if (countdown === 0) return "Time's up!";
    if (h > 0)  return `${h}h ${m}m remaining`;
    if (m > 0)  return `${m}m ${String(s).padStart(2, "0")}s remaining`;
    return `${s}s remaining`;
  };

  const countdownColor =
    countdown < 300  ? "#FF8A7A" :
    countdown < 600  ? "#FFD580" :
    "rgba(255,255,255,0.95)";

  const progressPct = (COMPLETED_STOPS / TOTAL_STOPS) * 100; // 40%

  const handleDone = () => {
    setDoneState("success");
    setTimeout(() => onBack(), 900);
  };

  const btnStyle = (id: string, base: React.CSSProperties): React.CSSProperties => ({
    ...base,
    transform: pressedBtn === id ? "scale(0.95)" : "scale(1)",
    transition: "transform 0.12s ease, opacity 0.12s ease",
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
        @keyframes live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes exec-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-reveal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes done-flash {
          0%   { opacity: 0; transform: scale(0.8); }
          40%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .live-dot   { animation: live-pulse 2.2s ease-in-out infinite; }
        .hero-in    { animation: hero-reveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both; }
        .status-in  { animation: exec-up 0.4s ease 0.0s both; }
        .next-in    { animation: exec-up 0.46s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
        .hint-in    { animation: exec-up 0.4s ease 0.3s both; }
        .done-icon  { animation: done-flash 0.4s ease forwards; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── PROGRESS BAR (literal top) ── */}
      <div style={{ height: 3, background: "#E8E4DE", flexShrink: 0, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: CORAL,
            borderRadius: "0 2px 2px 0",
            opacity: visible ? 1 : 0,
            transition: "width 1.2s cubic-bezier(0.22,1,0.36,1) 0.1s, opacity 0.4s ease",
          }}
        />
      </div>

      {/* ── STATUS ROW ── */}
      <div
        className="status-in"
        style={{
          paddingTop: 48,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 0,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left: stop dots + label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {Array.from({ length: TOTAL_STOPS }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width:  i < COMPLETED_STOPS ? 7 : i === COMPLETED_STOPS ? 9 : 5,
                    height: i < COMPLETED_STOPS ? 7 : i === COMPLETED_STOPS ? 9 : 5,
                    borderRadius: "50%",
                    background:
                      i < COMPLETED_STOPS   ? CORAL :
                      i === COMPLETED_STOPS ? CORAL :
                      "#D8D4CE",
                    border: i === COMPLETED_STOPS ? `2px solid ${CORAL}` : "none",
                    boxShadow: i === COMPLETED_STOPS ? `0 0 0 3px rgba(232,93,58,0.18)` : "none",
                    opacity: i > COMPLETED_STOPS ? 0.55 : 1,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "#8A8278",
                fontWeight: 400,
              }}
            >
              {COMPLETED_STOPS} of {TOTAL_STOPS} stops
            </span>
          </div>

          {/* Right: live clock */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              className="live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: CORAL,
              }}
            />
            <span
              style={{
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 12,
                color: CORAL,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {formatClock(clockTime)}
            </span>
          </div>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <div
        className="hero-in"
        style={{
          margin: "14px 16px 0",
          borderRadius: 22,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          height: 452,
        }}
      >
        {/* Background image */}
        <img
          src={HERO_IMAGE}
          alt="teamLab Borderless"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 28%, rgba(0,0,0,0.62) 65%, rgba(0,0,0,0.90) 100%)",
          }}
        />

        {/* Done overlay flash */}
        {doneState === "success" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(45,95,78,0.88)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              zIndex: 10,
            }}
          >
            <div className="done-icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27" stroke="white" strokeWidth="2" opacity="0.4" />
                <circle cx="28" cy="28" r="22" fill="white" opacity="0.15" />
                <path d="M17 28l8 8 14-14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "white", letterSpacing: "-0.2px" }}>
              Stop complete!
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              Heading to Meiji Shrine…
            </span>
          </div>
        )}

        {/* Content layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "18px 18px 20px",
          }}
        >
          {/* ── TOP: category + stop number ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {/* Category pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "white",
                fontSize: 12,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 13 }}>🎨</span>
              Art
            </span>

            {/* Stop indicator badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                borderRadius: 99,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.85)",
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              Stop 3
            </span>
          </div>

          {/* ── BOTTOM: activity info + buttons ── */}
          <div>
            {/* Activity name */}
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 600,
                color: "white",
                margin: "0 0 4px 0",
                lineHeight: 1.15,
                letterSpacing: "-0.4px",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              teamLab Borderless
            </h2>

            {/* Location */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: "rgba(255,255,255,0.65)",
                margin: "0 0 12px 0",
                letterSpacing: "0.01em",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none" style={{ flexShrink: 0 }}>
                <path d="M5.5 0C3.02 0 1 2.02 1 4.5c0 3.37 4.5 8.5 4.5 8.5s4.5-5.13 4.5-8.5C10 2.02 7.98 0 5.5 0zm0 6.5a2 2 0 110-4 2 2 0 010 4z" fill="rgba(255,255,255,0.6)" />
              </svg>
              Odaiba, Tokyo
            </p>

            {/* Countdown */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 13px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                marginBottom: 18,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke={countdownColor} strokeWidth="1.3" />
                <path d="M6.5 3.5V6.5l2 2" stroke={countdownColor} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span
                style={{
                  fontFamily: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace",
                  fontSize: 12.5,
                  color: countdownColor,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  transition: "color 0.5s ease",
                }}
              >
                {formatCountdown()}
              </span>
            </div>

            {/* ── BUTTONS ROW ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              {/* Navigate */}
              <button
                onMouseDown={() => setPressedBtn("nav")}
                onMouseUp={() => setPressedBtn(null)}
                onMouseLeave={() => setPressedBtn(null)}
                onTouchStart={() => setPressedBtn("nav")}
                onTouchEnd={() => setPressedBtn(null)}
                style={btnStyle("nav", {
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "11px 15px",
                  background: "rgba(255,255,255,0.13)",
                  border: "1.5px solid rgba(255,255,255,0.5)",
                  borderRadius: 11,
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  flexShrink: 0,
                })}
              >
                <span style={{ fontSize: 14 }}>📍</span>
                Navigate
              </button>

              {/* Done + Skip group */}
              <div style={{ display: "flex", gap: 7 }}>
                {/* Done */}
                <button
                  onClick={handleDone}
                  onMouseDown={() => setPressedBtn("done")}
                  onMouseUp={() => setPressedBtn(null)}
                  onMouseLeave={() => setPressedBtn(null)}
                  onTouchStart={() => setPressedBtn("done")}
                  onTouchEnd={() => setPressedBtn(null)}
                  style={btnStyle("done", {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "11px 17px",
                    background: SAGE,
                    border: "none",
                    borderRadius: 11,
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 3px 12px rgba(45,95,78,0.45)",
                    flexShrink: 0,
                  })}
                >
                  Done ✓
                </button>

                {/* Skip */}
                <button
                  onMouseDown={() => setPressedBtn("skip")}
                  onMouseUp={() => { setPressedBtn(null); onBack(); }}
                  onMouseLeave={() => setPressedBtn(null)}
                  onTouchStart={() => setPressedBtn("skip")}
                  onTouchEnd={() => { setPressedBtn(null); onBack(); }}
                  style={btnStyle("skip", {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "11px 13px",
                    background: "rgba(255,255,255,0.11)",
                    border: "1.5px solid rgba(255,255,255,0.38)",
                    borderRadius: 11,
                    color: "rgba(255,255,255,0.82)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    flexShrink: 0,
                  })}
                >
                  Skip →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── UP NEXT CARD ── */}
      <div
        className="next-in"
        style={{ margin: "10px 16px 0", flexShrink: 0 }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          {/* Pull-up chevron handle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 9,
              paddingBottom: 2,
              gap: 3,
            }}
          >
            <div
              style={{
                width: 32,
                height: 3.5,
                borderRadius: 99,
                background: "#E2DDD8",
              }}
            />
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none" style={{ opacity: 0.4 }}>
              <path d="M1 8L7 2L13 8" stroke="#8A8278" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Content row */}
          <div
            style={{
              display: "flex",
              padding: "4px 16px 18px",
              gap: 14,
              alignItems: "center",
            }}
          >
            {/* Left: text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    color: "#B0A99F",
                    fontFamily: "'Inter', sans-serif",
                    textTransform: "uppercase",
                  }}
                >
                  Up Next
                </span>
                <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                {/* Remaining stops pills */}
                <span
                  style={{
                    fontSize: 10,
                    color: "#B0A99F",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  +{UPCOMING.length} stops
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  fontWeight: 600,
                  color: DARK,
                  margin: "0 0 4px 0",
                  lineHeight: 1.2,
                  letterSpacing: "-0.2px",
                }}
              >
                {UPCOMING[0].name}
              </h3>

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 11,
                    color: "#8A8278",
                    fontWeight: 500,
                  }}
                >
                  {UPCOMING[0].time}
                </span>
                <span style={{ color: "#C5BEB6", fontSize: 10 }}>·</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#A09890" }}>
                  {UPCOMING[0].transit}
                </span>
              </div>

              {/* Upcoming mini-dots */}
              <div style={{ display: "flex", gap: 5, marginTop: 9, alignItems: "center" }}>
                {UPCOMING.map((stop, i) => (
                  <div key={stop.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {i > 0 && <div style={{ width: 12, height: 1, background: "#E2DDD8" }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: i === 0 ? SAGE : "#D8D4CE",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 10,
                          color: i === 0 ? "#5A5248" : "#B0A99F",
                          fontWeight: i === 0 ? 500 : 400,
                        }}
                      >
                        {stop.name.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Meiji thumbnail */}
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 12,
                overflow: "hidden",
                flexShrink: 0,
                position: "relative",
              }}
            >
              <img
                src={MEIJI_IMAGE}
                alt="Meiji Shrine"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Category badge overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 5,
                  left: 5,
                  padding: "2px 6px",
                  background: "rgba(0,0,0,0.45)",
                  borderRadius: 6,
                  backdropFilter: "blur(4px)",
                }}
              >
                <span style={{ fontSize: 11, lineHeight: 1 }}>{UPCOMING[0].emoji}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HINT ── */}
      <div
        className="hint-in"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 28,
        }}
      >
        <button
          onClick={onAdjust}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "#B0A99F",
              letterSpacing: "0.01em",
            }}
          >
            Plans changed? Tap to adjust
          </span>
          <span style={{ fontSize: 12, color: "#C5BEB6" }}>→</span>
        </button>
      </div>
    </div>
  );
}
