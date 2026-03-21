import { useState, useCallback } from "react";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";

interface Activity {
  name: string;
  description: string;
  category: string;
  emoji: string;
  duration: string;
  image: string;
}

interface ActivityPair {
  top: Activity;
  bottom: Activity;
}

const ACTIVITY_PAIRS: ActivityPair[] = [
  {
    top: {
      name: "Tsukiji Outer Market",
      description: "Fresh sushi, tamagoyaki & street bites from local vendors",
      category: "Food",
      emoji: "🍜",
      duration: "~45 min",
      image: "https://images.unsplash.com/photo-1590582917892-a6e11d1b32bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUc3VraWppJTIwZmlzaCUyMG1hcmtldCUyMFRva3lvJTIwZm9vZCUyMHN0YWxsc3xlbnwxfHx8fDE3NzM4NjI4NzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    bottom: {
      name: "Meiji Shrine",
      description: "Peaceful forested escape in the heart of Harajuku",
      category: "Culture",
      emoji: "⛩️",
      duration: "~1.5 hr",
      image: "https://images.unsplash.com/photo-1686933021179-f376a84dfc66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNZWlqaSUyMFNocmluZSUyMFRva3lvJTIwdG9yaWklMjBnYXRlfGVufDF8fHx8MTc3Mzg2Mjg3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  },
  {
    top: {
      name: "Ichiran Ramen",
      description: "Solo booth tonkotsu ramen — rich, private, deeply local",
      category: "Food",
      emoji: "🍜",
      duration: "~30 min",
      image: "https://images.unsplash.com/photo-1598977700511-fe0707d5eae6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMHJhbWVuJTIwcmVzdGF1cmFudCUyMGJvd2x8ZW58MXx8fHwxNzczODYyODcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    bottom: {
      name: "Shibuya Crossing",
      description: "The world's busiest intersection at dusk — pure spectacle",
      category: "Experience",
      emoji: "🌆",
      duration: "~20 min",
      image: "https://images.unsplash.com/photo-1609942225969-3f3109a13eb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaGlidXlhJTIwY3Jvc3NpbmclMjBUb2t5byUyMHN0cmVldCUyMG5pZ2h0fGVufDF8fHx8MTc3Mzg2Mjg3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  },
  {
    top: {
      name: "teamLab Planets",
      description: "Walk through digital infinity in this immersive art space",
      category: "Art",
      emoji: "🎨",
      duration: "~2 hr",
      image: "https://images.unsplash.com/photo-1771773496809-95ba94e8cb07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtTGFiJTIwZGlnaXRhbCUyMGFydCUyMG11c2V1bSUyMFRva3lvfGVufDF8fHx8MTc3Mzg2Mjg3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    bottom: {
      name: "Sumo Morning Practice",
      description: "Watch wrestlers train at a traditional Ryogoku stable",
      category: "Sport",
      emoji: "🏆",
      duration: "~1 hr",
      image: "https://images.unsplash.com/photo-1602234790740-0f87824c0394?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMHN1bW8lMjB3cmVzdGxpbmclMjBtYXRjaHxlbnwxfHx8fDE3NzM4NjI4NzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  },
  {
    top: {
      name: "Senso-ji Temple",
      description: "Tokyo's oldest Buddhist temple in lively Asakusa district",
      category: "Culture",
      emoji: "⛩️",
      duration: "~1 hr",
      image: "https://images.unsplash.com/photo-1771385706304-19ab1fb5fd61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW5zby1qaSUyMHRlbXBsZSUyMEFzYWt1c2ElMjBUb2t5byUyMGxhbnRlcm58ZW58MXx8fHwxNzczODYyODgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    bottom: {
      name: "Shinjuku Gyoen",
      description: "Vast garden blending French, English & Japanese landscaping",
      category: "Nature",
      emoji: "🌸",
      duration: "~1.5 hr",
      image: "https://images.unsplash.com/photo-1743834722201-92ce713c4342?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTaGluanVrdSUyMEd5b2VuJTIwZ2FyZGVuJTIwY2hlcnJ5JTIwYmxvc3NvbXxlbnwxfHx8fDE3NzM4NjI4ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  },
  {
    top: {
      name: "Golden Gai Bar Hop",
      description: "Squeeze into tiny 6-seat bars in Shinjuku's iconic alley maze",
      category: "Nightlife",
      emoji: "🍸",
      duration: "~3 hr",
      image: "https://images.unsplash.com/photo-1758402277819-2517d9ab960b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWtlJTIwYmFyJTIwaXpha2F5YSUyMEphcGFuJTIwZHJpbmtzfGVufDF8fHx8MTc3Mzg2Mjg4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    bottom: {
      name: "Tokyo DisneySea",
      description: "Seven nautical themed ports in Japan's most beloved park",
      category: "Adventure",
      emoji: "🎡",
      duration: "~8 hr",
      image: "https://images.unsplash.com/photo-1718870006042-69a95b9a6e81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMERpc25leVNlYSUyMHRoZW1lJTIwcGFyayUyMEphcGFufGVufDF8fHx8MTc3Mzg2Mjg4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Food:       { bg: "#FFF0EB", text: "#C44B29" },
  Culture:    { bg: "#F0EEF8", text: "#5A4D8A" },
  Experience: { bg: "#EBF5FF", text: "#2D6FA3" },
  Art:        { bg: "#FFF8EB", text: "#A06B20" },
  Sport:      { bg: "#EBFAF0", text: "#237A44" },
  Nature:     { bg: "#F0F8F0", text: "#2D6B3A" },
  Nightlife:  { bg: "#F8EBF5", text: "#8A3A72" },
  Adventure:  { bg: "#FFF3EB", text: "#B05A20" },
};

type Phase = "idle" | "pick" | "exit" | "finishing";

interface VotingScreenProps {
  onSeeResults: () => void;
  onBack: () => void;
}

export function VotingScreen({ onSeeResults, onBack }: VotingScreenProps) {
  const [pairIndex, setPairIndex] = useState(0);
  const [cardKey, setCardKey] = useState(0);
  const [selected, setSelected] = useState<"top" | "bottom" | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(5);
  const totalSteps = 12;

  const advanceToNext = useCallback(() => {
    const isLast = step >= totalSteps;
    setPhase("exit");
    setTimeout(() => {
      if (isLast) {
        // Final comparison — auto-transition to results
        setPhase("finishing");
        setTimeout(() => onSeeResults(), 480);
        return;
      }
      setPairIndex((i) => (i + 1) % ACTIVITY_PAIRS.length);
      setSelected(null);
      setCardKey((k) => k + 1);
      setStep((s) => s + 1);
      setPhase("idle");
    }, 320);
  }, [step, totalSteps, onSeeResults]);

  const handleCardTap = (card: "top" | "bottom") => {
    if (phase !== "idle") return;
    setSelected(card);
    setPhase("pick");
    setTimeout(advanceToNext, 720);
  };

  const handleSkip = () => {
    if (phase !== "idle") return;
    advanceToNext();
  };

  const pair = ACTIVITY_PAIRS[pairIndex];
  const progressPct = (step / totalSteps) * 100;

  const getCardStyle = (position: "top" | "bottom"): React.CSSProperties => {
    const isSelected = selected === position;
    const isOther = selected !== null && selected !== position;

    if (phase === "exit") {
      return {
        opacity: 0,
        transform: "translateY(-14px) scale(0.97)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
        pointerEvents: "none",
      };
    }

    if (phase === "pick") {
      return {
        opacity: isOther ? 0.45 : 1,
        outline: isSelected ? `2.5px solid ${CORAL}` : "2.5px solid transparent",
        outlineOffset: "0px",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
        boxShadow: isSelected
          ? `0 6px 24px 0 rgba(232,93,58,0.18), 0 2px 8px 0 rgba(0,0,0,0.04)`
          : "0 2px 8px 0 rgba(0,0,0,0.04)",
        transition: "opacity 0.22s ease, outline-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease",
      };
    }

    return {
      opacity: 1,
      outline: "2.5px solid transparent",
      transform: "scale(1)",
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
      transition: "opacity 0.22s ease",
    };
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: 390, height: 844, background: BG, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes wander-enter {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cards-enter { animation: wander-enter 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 shrink-0">
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 0",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 5L7.5 10l5 5" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500, color: DARK, letterSpacing: "-0.1px" }}>
            Home
          </span>
        </button>
        <div
          className="rounded-full overflow-hidden shrink-0"
          style={{ width: 36, height: 36, background: "#D9C9B8", border: "2px solid #E8E0D6", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="8.5" r="4" fill="#A89080" />
            <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" fill="#A89080" />
          </svg>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: 11, color: "#9A9080", fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            Building your ranking
          </span>
          <span style={{ fontSize: 12, color: "#9A9080", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            {step} of {totalSteps}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: "#EAE6E0", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: CORAL, borderRadius: 99, transition: "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }} />
        </div>
      </div>

      {/* PROMPT */}
      <div className="px-5 pb-2 shrink-0">
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 15, color: "#8A7E72", margin: 0 }}>
          Which would you rather do?
        </p>
      </div>

      {/* CARDS AREA */}
      <div className="flex-1 flex flex-col min-h-0 px-5 overflow-hidden pb-2">
        <div key={cardKey} className="cards-enter flex-1 flex flex-col min-h-0">
          <div
            className="flex-1 rounded-[12px] overflow-hidden cursor-pointer select-none min-h-0"
            style={{ background: "#FFFFFF", ...getCardStyle("top") }}
            onClick={() => handleCardTap("top")}
          >
            <ActivityCardInner activity={pair.top} />
          </div>
          <div className="flex items-center justify-center shrink-0" style={{ height: 28 }}>
            <div style={{ width: 32, height: 1, background: "#E2DDD8" }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 13, color: "#BEB5AC", margin: "0 10px" }}>or</span>
            <div style={{ width: 32, height: 1, background: "#E2DDD8" }} />
          </div>
          <div
            className="flex-1 rounded-[12px] overflow-hidden cursor-pointer select-none min-h-0"
            style={{ background: "#FFFFFF", ...getCardStyle("bottom") }}
            onClick={() => handleCardTap("bottom")}
          >
            <ActivityCardInner activity={pair.bottom} />
          </div>
        </div>
      </div>

      {/* SKIP + SEE RESULTS */}
      <div className="flex flex-col items-center pb-6 pt-1 shrink-0 gap-1">
        <button
          onClick={handleSkip}
          style={{ background: "none", border: "none", cursor: phase === "idle" ? "pointer" : "default", fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#B0A99F", opacity: phase === "idle" ? 1 : 0.4, transition: "opacity 0.2s ease", padding: "4px 12px" }}
        >
          Skip this one
        </button>
        {step < totalSteps ? (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#C5BEB6", margin: 0, fontStyle: "italic" }}>
            {totalSteps - step} comparison{totalSteps - step !== 1 ? "s" : ""} left
          </p>
        ) : (
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 12, color: CORAL, margin: 0 }}>
            Final comparison — make it count
          </p>
        )}
      </div>
    </div>
  );
}

function ActivityCardInner({ activity }: { activity: Activity }) {
  const catColors = CATEGORY_COLORS[activity.category] ?? { bg: "#F5F3F0", text: "#666" };
  return (
    <div className="flex flex-col h-full">
      <div style={{ height: "42%", flexShrink: 0, overflow: "hidden", position: "relative", background: "#EDE8E2" }}>
        <img src={activity.image} alt={activity.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)", pointerEvents: "none" }} />
      </div>
      <div className="flex flex-col justify-between" style={{ flex: 1, padding: "12px 14px 13px 14px", minHeight: 0 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: "#1A1A1A", margin: 0, lineHeight: 1.25, letterSpacing: "-0.2px" }}>
            {activity.name}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#7A7268", margin: "5px 0 0 0", lineHeight: 1.4, fontWeight: 400 }}>
            {activity.description}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: catColors.bg, color: catColors.text, fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 500, whiteSpace: "nowrap" as const }}>
            <span style={{ fontSize: 11 }}>{activity.emoji}</span>
            {activity.category}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 99, background: "#F3F1EE", color: "#9A9080", fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 400, whiteSpace: "nowrap" as const }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="#B0A99F" strokeWidth="1.2" />
              <path d="M5 2.8V5l1.4 1.4" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {activity.duration}
          </span>
        </div>
      </div>
    </div>
  );
}