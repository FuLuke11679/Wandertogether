import { useEffect, useState } from "react";

const CORAL = "#E85D3A";
const SAGE  = "#2D5F4E";
const DARK  = "#1A1A1A";
const BG    = "#FAFAF8";

// Top priorities that "emerge" one by one while building
const PRIORITIES = [
  { emoji: "⛩️", name: "Senso-ji Temple",         category: "Culture",   rank: 1 },
  { emoji: "🍜", name: "Tsukiji Outer Market",     category: "Food",      rank: 2 },
  { emoji: "🎨", name: "teamLab Planets",           category: "Art",       rank: 3 },
  { emoji: "🌸", name: "Shinjuku Gyoen",            category: "Nature",    rank: 4 },
  { emoji: "🍸", name: "Golden Gai Bar Hop",        category: "Nightlife", rank: 5 },
];

// Fake route "stops" on the map strip
const ROUTE_NODES = [
  { x: 42,  y: 62,  label: "Tsukiji",   delay: 600  },
  { x: 128, y: 38,  label: "Senso-ji",  delay: 900  },
  { x: 218, y: 52,  label: "teamLab",   delay: 1200 },
  { x: 298, y: 32,  label: "Gyoen",     delay: 1500 },
  { x: 352, y: 58,  label: "Shinjuku",  delay: 1800 },
];

const STYLES = `
  @keyframes bi-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bi-scalein {
    from { opacity: 0; transform: scale(0.6); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes bi-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes bi-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes bi-pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.9); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }
  @keyframes bi-linegrow {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .bi-node-enter { animation: bi-scalein 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .bi-item-enter { animation: bi-fadein  0.35s cubic-bezier(0.22, 1, 0.36, 1) both;   }
`;

interface Props {
  onComplete: () => void;
}

export function BuildingItineraryScreen({ onComplete }: Props) {
  const [phase,            setPhase]          = useState<0 | 1 | 2 | 3>(0);
  const [visibleNodes,     setVisibleNodes]   = useState<number[]>([]);
  const [visiblePriorities,setVisiblePri]     = useState<number[]>([]);
  const [progressDone,     setProgressDone]   = useState(false);

  useEffect(() => {
    // Phase 0 → 1: initial text appears
    const t0 = setTimeout(() => setPhase(1), 200);

    // Nodes appear one by one
    ROUTE_NODES.forEach((n, i) => {
      setTimeout(() => setVisibleNodes(prev => [...prev, i]), n.delay);
    });

    // Priorities list appears
    PRIORITIES.forEach((_, i) => {
      setTimeout(() => setVisiblePri(prev => [...prev, i]), 800 + i * 220);
    });

    // Phase 2: "almost done" feel
    const t2 = setTimeout(() => setPhase(2), 2100);

    // Phase 3: done — trigger navigation
    const t3 = setTimeout(() => {
      setProgressDone(true);
      setPhase(3);
    }, 2700);

    const t4 = setTimeout(() => onComplete(), 3200);

    return () => { clearTimeout(t0); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Subtle texture rings ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[340, 500, 660].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: r,
              height: r,
              borderRadius: "50%",
              border: `1px solid rgba(232,93,58,${0.05 - i * 0.012})`,
              transform: "translate(-50%, -50%)",
              transition: `opacity 0.8s ease ${i * 0.2}s`,
              opacity: phase >= 1 ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* ── Map strip ── */}
      <div
        style={{
          width: 350,
          height: 100,
          marginBottom: 36,
          position: "relative",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.55s ease 0.15s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.15s",
        }}
      >
        {/* Route line base */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 42,
            right: 38,
            height: 2,
            borderRadius: 99,
            background: "#EDE9E4",
          }}
        />
        {/* Animated coral fill */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 42,
            height: 2,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${CORAL}, #F0703A)`,
            animation: visibleNodes.length > 0 ? "bi-linegrow 2s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
            width: 0,
          }}
        />

        {/* Nodes */}
        {ROUTE_NODES.map((node, i) => {
          const visible = visibleNodes.includes(i);
          return (
            <div
              key={i}
              className={visible ? "bi-node-enter" : ""}
              style={{
                position: "absolute",
                left: node.x,
                top: node.y - 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: visible ? 1 : 0,
                animationDelay: "0s",
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: i === 0 ? CORAL : "white",
                  border: `2px solid ${i === 0 ? CORAL : CORAL}`,
                  boxShadow: `0 0 0 3px ${CORAL}22`,
                  marginBottom: 4,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: "#A09888",
                  whiteSpace: "nowrap" as const,
                  letterSpacing: "0.01em",
                }}
              >
                {node.label}
              </span>
            </div>
          );
        })}

        {/* Pulsing active dot on the leading edge */}
        {visibleNodes.length > 0 && visibleNodes.length < ROUTE_NODES.length && (() => {
          const lastIdx = Math.max(...visibleNodes);
          const lastNode = ROUTE_NODES[lastIdx];
          return (
            <div
              style={{
                position: "absolute",
                left: lastNode.x + 2,
                top: lastNode.y - 2,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: CORAL,
                animation: "bi-pulse 1s ease infinite",
              }}
            />
          );
        })()}
      </div>

      {/* ── Heading ── */}
      <div
        style={{
          textAlign: "center" as const,
          marginBottom: 28,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.5s ease 0.3s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s",
        }}
      >
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontStyle: "italic",
            fontSize: 28,
            color: DARK,
            margin: "0 0 8px",
            letterSpacing: "-0.4px",
            lineHeight: 1.2,
          }}
        >
          {phase < 3 ? "Building your perfect day…" : "Your itinerary is ready ✦"}
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#A09888",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {phase < 3
            ? "Optimising route from your group's priorities"
            : "Tap anywhere to continue"}
        </p>
      </div>

      {/* ── Priority chips appearing ── */}
      <div
        style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 36,
        }}
      >
        {PRIORITIES.map((p, i) => {
          const visible = visiblePriorities.includes(i);
          return (
            <div
              key={p.rank}
              className={visible ? "bi-item-enter" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                background: "white",
                borderRadius: 12,
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                border: "1px solid #EDE9E4",
                opacity: visible ? 1 : 0,
                animationDelay: "0s",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  background: i === 0 ? `${CORAL}18` : "#F5F2EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 12 }}>{p.emoji}</span>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: DARK,
                  flex: 1,
                }}
              >
                {p.name}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {i === 0 && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.1l-2.78 1.45.53-3.1L1.5 4.25l3.1-.45z"
                      fill={CORAL} />
                  </svg>
                )}
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: i === 0 ? CORAL : "#B0A99F",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  #{p.rank}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          width: 200,
          height: 3,
          borderRadius: 99,
          background: "#EDE9E4",
          overflow: "hidden",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 0.4s ease 0.5s",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: `linear-gradient(90deg, ${CORAL}, #F0703A)`,
            animation: phase >= 1 ? `bi-progress ${progressDone ? 0.3 : 2.6}s cubic-bezier(0.22, 1, 0.36, 1) ${progressDone ? "0s" : "0.4s"} forwards` : "none",
            width: progressDone ? "100%" : 0,
          }}
        />
      </div>

      {/* ── Spinner / done check ── */}
      <div style={{ marginTop: 14, height: 20 }}>
        {phase < 3 ? (
          <svg
            width="18" height="18" viewBox="0 0 18 18" fill="none"
            style={{ animation: "bi-spin 1s linear infinite" }}
          >
            <circle cx="9" cy="9" r="7" stroke="#EDE9E4" strokeWidth="2" />
            <path d="M9 2a7 7 0 017 7" stroke={CORAL} strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="bi-node-enter">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill={SAGE} />
              <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
