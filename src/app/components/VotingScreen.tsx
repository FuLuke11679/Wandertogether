import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTripStore } from "../../lib/store";
import type { Activity } from "../../lib/types";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  food:       { bg: "#FFF0EB", text: "#C44B29" },
  culture:    { bg: "#F0EEF8", text: "#5A4D8A" },
  shopping:   { bg: "#FFF8EB", text: "#A06B20" },
  nature:     { bg: "#F0F8F0", text: "#2D6B3A" },
  nightlife:  { bg: "#F8EBF5", text: "#8A3A72" },
  adventure:  { bg: "#FFF3EB", text: "#B05A20" },
};

const CURRENT_USER_ID = "sarah";
const CURRENT_USER_NAME = "Sarah";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = minutes / 60;
  return h % 1 === 0 ? `~${h} hr` : `~${h.toFixed(1)} hr`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Motion variants ─────────────────────────────────────────────────────────

const pairContainerVariants = {
  enter: { opacity: 0, y: 24 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: { duration: 0.28, ease: "easeIn" as const },
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "idle" | "pick" | "exit" | "finishing";

interface VotingScreenProps {
  tripId: string;
  onSeeResults: () => void;
  onBack: () => void;
  /** When signed in to Supabase, use session user id so rankings row matches RLS. */
  voterUserId?: string;
  voterUserName?: string;
}

export function VotingScreen({
  tripId,
  onSeeResults,
  onBack,
  voterUserId = CURRENT_USER_ID,
  voterUserName = CURRENT_USER_NAME,
}: VotingScreenProps) {
  const store = useTripStore();
  const comparisonCount = useTripStore((s) => s.comparisonCount);
  const totalSteps = store.getRecommendedTotal(tripId);
  const pair = store.getCurrentPair(tripId, voterUserId);
  const trip = store.getTrip(tripId);
  const hasVoterRanking = !!trip?.rankings.some((r) => r.userId === voterUserId);

  const [selected, setSelected] = useState<"a" | "b" | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    store.startVoting(tripId, voterUserId, voterUserName);
  }, [tripId, voterUserId, voterUserName, store]);

  const step = comparisonCount + 1;
  const progressPct = Math.min((comparisonCount / totalSteps) * 100, 100);
  const isLastComparison = comparisonCount >= totalSteps - 1;

  const advanceToNext = useCallback(() => {
    setPhase("exit");

    setTimeout(() => {
      if (comparisonCount >= totalSteps) {
        setPhase("finishing");
        store.generateGroupPriorities(tripId);
        setTimeout(() => onSeeResults(), 480);
        return;
      }
      setSelected(null);
      setPhase("idle");
    }, 320);
  }, [comparisonCount, totalSteps, onSeeResults, tripId, store]);

  const handleCardTap = (card: "a" | "b") => {
    if (phase !== "idle" || !pair) return;

    const winnerId = card === "a" ? pair.a.id : pair.b.id;
    const loserId = card === "a" ? pair.b.id : pair.a.id;

    setSelected(card);
    setPhase("pick");

    store.recordVote(tripId, voterUserId, winnerId, loserId);

    setTimeout(advanceToNext, 720);
  };

  const handleSkip = () => {
    if (phase !== "idle" || !pair) return;

    const pairKey = [pair.a.id, pair.b.id].sort().join(":");
    store.skipComparisonPair(tripId, pairKey);

    advanceToNext();
  };

  // startVoting runs in useEffect — first paint has no ranking yet; do not treat as "done".
  if (!pair && phase !== "exit" && phase !== "finishing") {
    if (!hasVoterRanking) {
      return null;
    }
    store.generateGroupPriorities(tripId);
    onSeeResults();
    return null;
  }

  const getCardStyle = (position: "a" | "b"): React.CSSProperties => {
    const isSelected = selected === position;
    const isOther = selected !== null && selected !== position;

    if (phase === "pick") {
      return {
        outline: isSelected ? `2.5px solid ${CORAL}` : "2.5px solid transparent",
        outlineOffset: "0px",
        boxShadow: isSelected
          ? `0 6px 24px 0 rgba(232,93,58,0.18), 0 2px 8px 0 rgba(0,0,0,0.04)`
          : "0 2px 8px 0 rgba(0,0,0,0.04)",
        opacity: isOther ? 0.45 : 1,
        transform: isSelected ? "scale(1.01)" : "scale(1)",
        transition: "opacity 0.22s ease, outline-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease",
      };
    }

    return {
      outline: "2.5px solid transparent",
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
      opacity: 1,
      transform: "scale(1)",
      transition: "opacity 0.22s ease",
    };
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: 390, height: 844, background: BG, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`* { -webkit-tap-highlight-color: transparent; }`}</style>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 shrink-0">
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
            {Math.min(step, totalSteps)} of {totalSteps}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: "#EAE6E0", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", background: CORAL, borderRadius: 99 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
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
        <AnimatePresence mode="wait">
          {pair && (
            <motion.div
              key={comparisonCount}
              className="flex-1 flex flex-col min-h-0"
              variants={pairContainerVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Card A */}
              <div
                className="flex-1 rounded-[12px] overflow-hidden cursor-pointer select-none min-h-0"
                style={{ background: "#FFFFFF", ...getCardStyle("a") }}
                onClick={() => handleCardTap("a")}
              >
                <ActivityCardInner activity={pair.a} />
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center shrink-0" style={{ height: 28 }}>
                <div style={{ width: 32, height: 1, background: "#E2DDD8" }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 13, color: "#BEB5AC", margin: "0 10px" }}>or</span>
                <div style={{ width: 32, height: 1, background: "#E2DDD8" }} />
              </div>

              {/* Card B */}
              <div
                className="flex-1 rounded-[12px] overflow-hidden cursor-pointer select-none min-h-0"
                style={{ background: "#FFFFFF", ...getCardStyle("b") }}
                onClick={() => handleCardTap("b")}
              >
                <ActivityCardInner activity={pair.b} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SKIP + STATUS */}
      <div className="flex flex-col items-center pb-6 pt-1 shrink-0 gap-1">
        <button
          onClick={handleSkip}
          style={{
            background: "none",
            border: "none",
            cursor: phase === "idle" ? "pointer" : "default",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#B0A99F",
            opacity: phase === "idle" ? 1 : 0.4,
            transition: "opacity 0.2s ease",
            padding: "4px 12px",
          }}
        >
          Skip this one
        </button>
        {isLastComparison ? (
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 12, color: CORAL, margin: 0 }}>
            Final comparison — make it count
          </p>
        ) : (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#C5BEB6", margin: 0, fontStyle: "italic" }}>
            {totalSteps - comparisonCount} comparison{totalSteps - comparisonCount !== 1 ? "s" : ""} left
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Activity Card (renders a store Activity) ────────────────────────────────

function ActivityCardInner({ activity }: { activity: Activity }) {
  const catColors = CATEGORY_COLORS[activity.category] ?? { bg: "#F5F3F0", text: "#666" };

  return (
    <div className="flex flex-col h-full">
      <div style={{ height: "42%", flexShrink: 0, overflow: "hidden", position: "relative", background: "#EDE8E2" }}>
        {activity.photoUrl && (
          <img
            src={activity.photoUrl}
            alt={activity.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
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
            {capitalize(activity.category)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 99, background: "#F3F1EE", color: "#9A9080", fontSize: 11, fontFamily: "'Inter', sans-serif", fontWeight: 400, whiteSpace: "nowrap" as const }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="#B0A99F" strokeWidth="1.2" />
              <path d="M5 2.8V5l1.4 1.4" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {formatDuration(activity.estimatedDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}
