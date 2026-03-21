import { useEffect, useState } from "react";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";
const SAGE = "#2D5F4E";

interface RankedActivity {
  rank: number;
  name: string;
  category: string;
  emoji: string;
  score: number; // 0–100, used for bar width %
  votes: number[]; // which of the 4 members voted for this (1-indexed)
}

const RANKED_ACTIVITIES: RankedActivity[] = [
  { rank: 1, name: "Senso-ji Temple",      category: "Culture",    emoji: "⛩️",  score: 96, votes: [1, 2, 3, 4] },
  { rank: 2, name: "Tsukiji Outer Market", category: "Food",       emoji: "🍜",  score: 86, votes: [1, 2, 4] },
  { rank: 3, name: "teamLab Borderless",   category: "Art",        emoji: "🎨",  score: 76, votes: [2, 3, 4] },
  { rank: 4, name: "Meiji Shrine",         category: "Culture",    emoji: "⛩️",  score: 63, votes: [1, 3] },
  { rank: 5, name: "Ichiran Ramen",        category: "Food",       emoji: "🍜",  score: 52, votes: [2, 4] },
  { rank: 6, name: "Golden Gai",           category: "Nightlife",  emoji: "🍸",  score: 40, votes: [3] },
  { rank: 7, name: "Shibuya Crossing",     category: "Experience", emoji: "🌆",  score: 30, votes: [1] },
  { rank: 8, name: "Harajuku Street",      category: "Shopping",   emoji: "🛍️", score: 20, votes: [2] },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Food:       { bg: "#FFF0EB", text: "#C44B29" },
  Culture:    { bg: "#F0EEF8", text: "#5A4D8A" },
  Experience: { bg: "#EBF5FF", text: "#2D6FA3" },
  Art:        { bg: "#FFF8EB", text: "#A06B20" },
  Nightlife:  { bg: "#F8EBF5", text: "#8A3A72" },
  Shopping:   { bg: "#F5F5F0", text: "#5A5A4A" },
};

const AVATARS = [
  { initials: "YK", bg: "#E8C4A0", text: "#8A5A30" },
  { initials: "MS", bg: "#B8D4B0", text: "#2D6B3A" },
  { initials: "AR", bg: "#C4B4D8", text: "#5A4D8A" },
  { initials: "TN", bg: "#E8D8A0", text: "#8A6A20" },
];

function getBarColor(rank: number): string {
  if (rank <= 3) return CORAL;
  if (rank <= 5) return SAGE;
  return "#C5BEB6";
}

interface ResultsScreenProps {
  onBack: () => void;
  onSetPreferences: () => void;
}

export function ResultsScreen({ onBack, onSetPreferences }: ResultsScreenProps) {
  const [visible, setVisible] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    // Trigger row entrance immediately
    const t1 = setTimeout(() => setVisible(true), 60);
    // Trigger bar animations a bit after rows appear
    const t2 = setTimeout(() => setBarsReady(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: 390, height: 844, background: BG, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes row-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bar-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes header-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .header-in {
          animation: header-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div
        className="flex items-center px-5 pt-14 pb-4 shrink-0 relative"
      >
        {/* Back arrow */}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B6258" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Centered wordmark */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 600,
              color: DARK,
              letterSpacing: "-0.3px",
            }}
          >
            WanderSync
          </span>
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div className="px-5 pb-4 shrink-0 header-in">
        {/* Trophy / sparkle accent */}
        <div className="flex items-center gap-2 mb-1">
          <span style={{ fontSize: 18 }}>✦</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              color: CORAL,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Group Results
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26,
            fontWeight: 600,
            color: DARK,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.4px",
          }}
        >
          Your Group's
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 500 }}>Top Picks</em>
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#8A7E72",
            margin: "6px 0 12px 0",
            fontWeight: 400,
          }}
        >
          Based on 4 members' preferences
        </p>

        {/* Avatar stack */}
        <div className="flex items-center gap-0">
          {AVATARS.map((av, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: av.bg,
                border: "2px solid #FAFAF8",
                marginLeft: i === 0 ? 0 : -8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: AVATARS.length - i,
                position: "relative",
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  fontWeight: 600,
                  color: av.text,
                  letterSpacing: "0.02em",
                }}
              >
                {av.initials}
              </span>
            </div>
          ))}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "#9A9080",
              marginLeft: 10,
              fontWeight: 400,
            }}
          >
            All voted ✓
          </span>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ height: 1, background: "#EAE6E0", margin: "0 20px 0 20px", flexShrink: 0 }} />

      {/* ── RANKED LIST ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 100 }}
      >
        {RANKED_ACTIVITIES.map((activity, index) => {
          const catColors = CATEGORY_COLORS[activity.category] ?? { bg: "#F5F3F0", text: "#666" };
          const barColor = getBarColor(activity.rank);
          const isTopRank = activity.rank <= 3;
          const rowDelay = index * 0.07;
          const barDelay = index * 0.07 + 0.18;

          return (
            <div
              key={activity.rank}
              style={{
                opacity: visible ? 1 : 0,
                animation: visible
                  ? `row-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) ${rowDelay}s both`
                  : "none",
                padding: "0 20px",
              }}
            >
              <div
                className="flex items-center"
                style={{
                  paddingTop: 14,
                  paddingBottom: 14,
                  borderBottom: index < RANKED_ACTIVITIES.length - 1 ? "1px solid #F0EDE8" : "none",
                  gap: 14,
                }}
              >
                {/* Rank number */}
                <div
                  style={{
                    width: 24,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isTopRank ? (
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: CORAL,
                        lineHeight: 1,
                      }}
                    >
                      {activity.rank}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#C5BEB6",
                        lineHeight: 1,
                      }}
                    >
                      {activity.rank}
                    </span>
                  )}
                </div>

                {/* Name + bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row: name + medal for top 3 */}
                  <div className="flex items-center gap-1.5" style={{ marginBottom: 7 }}>
                    <span
                      style={{
                        fontFamily: isTopRank ? "'Playfair Display', serif" : "'Inter', sans-serif",
                        fontSize: isTopRank ? 15 : 14,
                        fontWeight: isTopRank ? 600 : 450,
                        color: isTopRank ? DARK : "#3A3530",
                        letterSpacing: isTopRank ? "-0.15px" : "0",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        maxWidth: "100%",
                      }}
                    >
                      {activity.rank === 1 && <span style={{ marginRight: 4 }}>🥇</span>}
                      {activity.rank === 2 && <span style={{ marginRight: 4 }}>🥈</span>}
                      {activity.rank === 3 && <span style={{ marginRight: 4 }}>🥉</span>}
                      {activity.name}
                    </span>
                  </div>

                  {/* Enthusiasm bar */}
                  <div
                    style={{
                      height: 5,
                      borderRadius: 99,
                      background: "#EAE6E0",
                      overflow: "hidden",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${activity.score}%`,
                        background: barColor,
                        borderRadius: 99,
                        transformOrigin: "left center",
                        transform: barsReady ? "scaleX(1)" : "scaleX(0)",
                        transition: barsReady
                          ? `transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${barDelay}s`
                          : "none",
                      }}
                    />
                  </div>

                  {/* Vote dots */}
                  <div className="flex items-center gap-1" style={{ marginTop: 5 }}>
                    {AVATARS.map((av, i) => {
                      const voted = activity.votes.includes(i + 1);
                      return (
                        <div
                          key={i}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: voted ? av.bg : "#EAE6E0",
                            border: voted ? `1.5px solid ${av.text}33` : "1.5px solid #DDD8D0",
                            opacity: voted ? 1 : 0.5,
                            transition: `opacity 0.3s ease ${rowDelay + 0.3}s, background 0.3s ease`,
                          }}
                        />
                      );
                    })}
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10,
                        color: "#B0A99F",
                        marginLeft: 3,
                      }}
                    >
                      {activity.votes.length}/{AVATARS.length} chose this
                    </span>
                  </div>
                </div>

                {/* Category badge */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: catColors.bg,
                      color: catColors.text,
                      fontSize: 10,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 10 }}>{activity.emoji}</span>
                    {activity.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom spacer info */}
        <div
          style={{
            padding: "16px 20px 0",
            opacity: visible ? 1 : 0,
            transition: `opacity 0.5s ease ${RANKED_ACTIVITIES.length * 0.07 + 0.2}s`,
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: 13,
              color: "#B0A99F",
              margin: 0,
              textAlign: "center",
            }}
          >
            Ranked using pairwise comparison across the group
          </p>
        </div>
      </div>

      {/* ── STICKY BOTTOM BUTTON ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px 36px",
          background: "linear-gradient(to top, #FAFAF8 70%, transparent 100%)",
        }}
      >
        <button
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
            boxShadow: "0 4px 20px rgba(232, 93, 58, 0.32)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(232, 93, 58, 0.24)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(232, 93, 58, 0.32)";
          }}
          onTouchStart={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
          }}
          onTouchEnd={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
          onClick={onSetPreferences}
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
            Set Preferences &amp; Generate Plan
          </span>
          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.85)" }}>→</span>
        </button>
      </div>
    </div>
  );
}