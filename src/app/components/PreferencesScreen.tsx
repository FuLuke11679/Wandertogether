import { useState, useEffect } from "react";
import { useTripStore } from "../../lib/store";
import type { Pace, WalkingTolerance, Budget, ActivityCategory } from "../../lib/types";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";

const START_TIMES = ["7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"];
const END_TIMES = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"];

const FOCUS_OPTIONS = [
  { key: "Food",     emoji: "🍜" },
  { key: "Culture",  emoji: "⛩️" },
  { key: "Shopping", emoji: "🛍️" },
  { key: "Nature",   emoji: "🌳" },
  { key: "Nightlife",emoji: "🌙" },
];

// ─── Small reusable pieces ──────────────────────────────────────────────────

function SectionLabel({ n, label, hint }: { n: number; label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#FFF0EB",
            color: CORAL,
            fontSize: 10,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {n}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.11em",
            color: "#9A9080",
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      {hint && (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: 12,
            color: "#B0A99F",
            margin: "3px 0 0 28px",
            lineHeight: 1.35,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

interface ThreeCardRowProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; emoji: string; label: string; sub: string }[];
}

function ThreeCardRow<T extends string>({ value, onChange, options }: ThreeCardRowProps<T>) {
  const [pressed, setPressed] = useState<T | null>(null);

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((opt) => {
        const isSelected = value === opt.key;
        const isPressed = pressed === opt.key;
        return (
          <button
            key={opt.key}
            onMouseDown={() => setPressed(opt.key)}
            onMouseUp={() => { setPressed(null); onChange(opt.key); }}
            onMouseLeave={() => setPressed(null)}
            onTouchStart={() => setPressed(opt.key)}
            onTouchEnd={() => { setPressed(null); onChange(opt.key); }}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              background: isSelected ? "#FFF7F5" : "#FFFFFF",
              border: isSelected
                ? `2px solid ${CORAL}`
                : "1.5px solid #E8E6E2",
              borderRadius: 12,
              padding: "13px 6px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              textAlign: "center",
              transform: isPressed ? "scale(0.96)" : "scale(1)",
              boxShadow: isSelected
                ? "0 2px 12px rgba(232,93,58,0.12)"
                : "0 1px 4px rgba(0,0,0,0.04)",
              transition: "all 0.16s ease",
              WebkitTapHighlightColor: "transparent",
              position: "relative",
            }}
          >
            {/* Selected checkmark dot */}
            {isSelected && (
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: CORAL,
                }}
              />
            )}
            <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.emoji}</span>
            <span
              style={{
                fontFamily: isSelected ? "'Playfair Display', serif" : "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: isSelected ? 600 : 500,
                color: isSelected ? CORAL : DARK,
                lineHeight: 1.2,
                letterSpacing: isSelected ? "-0.1px" : "0",
              }}
            >
              {opt.label}
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                color: isSelected ? "#C4623E" : "#B0A99F",
                lineHeight: 1,
              }}
            >
              {opt.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

interface PreferencesScreenProps {
  onBack: () => void;
  onBuild: () => void;
  tripId?: string;
}

export function PreferencesScreen({ onBack, onBuild, tripId }: PreferencesScreenProps) {
  const [pace, setPace] = useState<"chill" | "balanced" | "intense">("balanced");
  const [walking, setWalking] = useState<"taxi" | "some" | "anywhere">("some");
  const [focusAreas, setFocusAreas] = useState<Set<string>>(new Set(["Food", "Culture"]));
  const [startTimeIdx, setStartTimeIdx] = useState(2); // 9:00 AM
  const [endTimeIdx, setEndTimeIdx] = useState(4);     // 9:00 PM
  const [budget, setBudget] = useState<"budget" | "moderate" | "splurge">("moderate");
  const [visible, setVisible] = useState(false);
  const [pressedTime, setPressedTime] = useState<"start" | "end" | null>(null);

  const store = useTripStore();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const toggleFocus = (key: string) => {
    setFocusAreas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const sectionAnim = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.48s ease ${delay}s, transform 0.48s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
  });

  const paceOptions = [
    { key: "chill" as const,    emoji: "🧘",  label: "Chill",    sub: "3–4 stops" },
    { key: "balanced" as const, emoji: "☀️",  label: "Balanced", sub: "5–6 stops" },
    { key: "intense" as const,  emoji: "⚡",  label: "Go go go", sub: "7+ stops"  },
  ];

  const walkingOptions = [
    { key: "taxi" as const,     emoji: "🚕", label: "Taxi life",       sub: "Minimal steps" },
    { key: "some" as const,     emoji: "👟", label: "Some walking",    sub: "Moderate steps" },
    { key: "anywhere" as const, emoji: "🥾", label: "I'll walk anywhere", sub: "Lots of steps" },
  ];

  const budgetOptions = [
    { key: "budget" as const,   emoji: "$",   label: "Budget",   sub: "Local & cheap" },
    { key: "moderate" as const, emoji: "$$",  label: "Moderate", sub: "Best of both" },
    { key: "splurge" as const,  emoji: "$$$", label: "Splurge",  sub: "No limits" },
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
        @keyframes pref-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        .pill-focus {
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.14s ease;
        }
        .pill-focus:active { transform: scale(0.94); }
      `}</style>

      {/* ── TOP BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "52px 20px 10px",
          flexShrink: 0,
          ...sectionAnim(0),
        }}
      >
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="#6B6258" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: DARK, letterSpacing: "-0.3px" }}>
            WanderSync
          </span>
        </div>
        <div style={{ width: 20 }} />
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 108,
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {/* Header */}
        <div style={{ padding: "14px 20px 22px", ...sectionAnim(0.04) }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <span style={{ fontSize: 11, color: CORAL, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Trip Preferences
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 27,
              fontWeight: 600,
              color: DARK,
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: "-0.4px",
            }}
          >
            Customize
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 500 }}>Your Trip</em>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#8A7E72", margin: "7px 0 0", lineHeight: 1.45 }}>
            Help us plan your perfect day in Tokyo
          </p>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ height: 1, background: "#EAE6E0", margin: "0 20px 24px" }} />

        {/* ── SECTION 1: PACE ── */}
        <div style={{ padding: "0 20px 26px", ...sectionAnim(0.10) }}>
          <SectionLabel n={1} label="Pace" hint="How much do you want to pack in?" />
          <ThreeCardRow value={pace} onChange={setPace} options={paceOptions} />
        </div>

        {/* ── SECTION 2: WALKING ── */}
        <div style={{ padding: "0 20px 26px", ...sectionAnim(0.18) }}>
          <SectionLabel n={2} label="Walking" hint="How far are your feet prepared to go?" />
          <ThreeCardRow value={walking} onChange={setWalking} options={walkingOptions} />
        </div>

        {/* ── SECTION 3: FOCUS AREAS ── */}
        <div style={{ padding: "0 20px 26px", ...sectionAnim(0.26) }}>
          <SectionLabel n={3} label="Focus Areas" hint="Pick as many as you like" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {FOCUS_OPTIONS.map(({ key, emoji }) => {
              const isOn = focusAreas.has(key);
              return (
                <button
                  key={key}
                  className="pill-focus"
                  onClick={() => toggleFocus(key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 99,
                    border: isOn ? `2px solid ${CORAL}` : "1.5px solid #E8E6E2",
                    background: isOn ? CORAL : "#FFFFFF",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{emoji}</span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: isOn ? 600 : 400,
                      color: isOn ? "#FFFFFF" : "#5A5248",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {key}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Selected count indicator */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#B0A99F", margin: "10px 0 0 2px" }}>
            {focusAreas.size === 0
              ? "Pick at least one to continue"
              : `${focusAreas.size} area${focusAreas.size > 1 ? "s" : ""} selected`}
          </p>
        </div>

        {/* ── SECTION 4: WHEN ── */}
        <div style={{ padding: "0 20px 26px", ...sectionAnim(0.34) }}>
          <SectionLabel n={4} label="When" hint="Tap to adjust your day window" />
          <div style={{ display: "flex", gap: 10 }}>
            {/* Start Time */}
            <button
              onMouseDown={() => setPressedTime("start")}
              onMouseUp={() => { setPressedTime(null); setStartTimeIdx((i) => (i + 1) % START_TIMES.length); }}
              onMouseLeave={() => setPressedTime(null)}
              onTouchStart={() => setPressedTime("start")}
              onTouchEnd={() => { setPressedTime(null); setStartTimeIdx((i) => (i + 1) % START_TIMES.length); }}
              style={{
                flex: 1,
                background: "#FFFFFF",
                border: "1.5px solid #E8E6E2",
                borderRadius: 14,
                padding: "14px 14px 12px",
                cursor: "pointer",
                textAlign: "left" as const,
                transform: pressedTime === "start" ? "scale(0.97)" : "scale(1)",
                transition: "transform 0.14s ease, box-shadow 0.14s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#B0A99F", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 500 }}>
                  Start
                </span>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M9 1.5L11.5 4L5 10.5H2.5V8L9 1.5Z" stroke="#C5BEB6" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: DARK, letterSpacing: "-0.3px", lineHeight: 1 }}>
                  {START_TIMES[startTimeIdx].split(" ")[0]}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#9A9080", fontWeight: 500 }}>
                  {START_TIMES[startTimeIdx].split(" ")[1]}
                </span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#C5BEB6", margin: "5px 0 0", lineHeight: 1 }}>
                Tap to change ↻
              </p>
            </button>

            {/* Arrow between */}
            <div style={{ display: "flex", alignItems: "center", color: "#C5BEB6", fontSize: 16 }}>→</div>

            {/* End Time */}
            <button
              onMouseDown={() => setPressedTime("end")}
              onMouseUp={() => { setPressedTime(null); setEndTimeIdx((i) => (i + 1) % END_TIMES.length); }}
              onMouseLeave={() => setPressedTime(null)}
              onTouchStart={() => setPressedTime("end")}
              onTouchEnd={() => { setPressedTime(null); setEndTimeIdx((i) => (i + 1) % END_TIMES.length); }}
              style={{
                flex: 1,
                background: "#FFFFFF",
                border: "1.5px solid #E8E6E2",
                borderRadius: 14,
                padding: "14px 14px 12px",
                cursor: "pointer",
                textAlign: "left" as const,
                transform: pressedTime === "end" ? "scale(0.97)" : "scale(1)",
                transition: "transform 0.14s ease, box-shadow 0.14s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#B0A99F", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 500 }}>
                  End
                </span>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M9 1.5L11.5 4L5 10.5H2.5V8L9 1.5Z" stroke="#C5BEB6" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: DARK, letterSpacing: "-0.3px", lineHeight: 1 }}>
                  {END_TIMES[endTimeIdx].split(" ")[0]}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#9A9080", fontWeight: 500 }}>
                  {END_TIMES[endTimeIdx].split(" ")[1]}
                </span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#C5BEB6", margin: "5px 0 0", lineHeight: 1 }}>
                Tap to change ↻
              </p>
            </button>
          </div>

          {/* Duration pill */}
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: 99,
                background: "#F3F1EE",
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: "#8A7E72",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#B0A99F" strokeWidth="1.1" />
                <path d="M5 2.8V5l1.4 1.4" stroke="#B0A99F" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              {(() => {
                const startH = parseInt(START_TIMES[startTimeIdx].split(":")[0]);
                const endH = parseInt(END_TIMES[endTimeIdx].split(":")[0]) + 12;
                const dur = endH - startH;
                return `${dur} hour day`;
              })()}
            </span>
          </div>
        </div>

        {/* ── SECTION 5: BUDGET ── */}
        <div style={{ padding: "0 20px 32px", ...sectionAnim(0.42) }}>
          <SectionLabel n={5} label="Budget" hint="Per person, per day" />
          <div style={{ display: "flex", gap: 8 }}>
            {budgetOptions.map((opt) => {
              const isSelected = budget === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setBudget(opt.key)}
                  style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    background: isSelected ? "#FFF7F5" : "#FFFFFF",
                    border: isSelected ? `2px solid ${CORAL}` : "1.5px solid #E8E6E2",
                    borderRadius: 12,
                    padding: "14px 6px 13px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    textAlign: "center",
                    boxShadow: isSelected ? "0 2px 12px rgba(232,93,58,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "all 0.16s ease",
                    WebkitTapHighlightColor: "transparent",
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <span style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: CORAL }} />
                  )}
                  {/* Dollar signs styled prominently */}
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 19,
                      fontWeight: 700,
                      color: isSelected ? CORAL : "#C5BEB6",
                      letterSpacing: "1px",
                      lineHeight: 1,
                    }}
                  >
                    {opt.emoji}
                  </span>
                  <span
                    style={{
                      fontFamily: isSelected ? "'Playfair Display', serif" : "'Inter', sans-serif",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? CORAL : DARK,
                      lineHeight: 1.2,
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      color: isSelected ? "#C4623E" : "#B0A99F",
                      lineHeight: 1,
                    }}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 20px 36px",
          background: "linear-gradient(to top, #FAFAF8 72%, transparent 100%)",
          ...sectionAnim(0.52),
        }}
      >
        {/* Summary line */}
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: "italic",
            fontSize: 12,
            color: "#B0A99F",
            textAlign: "center",
            margin: "0 0 10px",
          }}
        >
          {pace === "chill" ? "A leisurely" : pace === "intense" ? "An action-packed" : "A balanced"}{" "}
          {(() => {
            const startH = parseInt(START_TIMES[startTimeIdx].split(":")[0]);
            const endH = parseInt(END_TIMES[endTimeIdx].split(":")[0]) + 12;
            return endH - startH;
          })()}-hour day with {focusAreas.size} focus area{focusAreas.size !== 1 ? "s" : ""}
        </p>

        <button
          onClick={() => {
            const paceMap: Record<string, Pace> = { chill: "relaxed", balanced: "moderate", intense: "packed" };
            const walkMap: Record<string, WalkingTolerance> = { taxi: "minimal", some: "moderate", anywhere: "explorer" };
            const budgetMap: Record<string, Budget> = { budget: "low", moderate: "medium", splurge: "high" };
            const startH = parseInt(START_TIMES[startTimeIdx].split(":")[0]);
            const startAmPm = START_TIMES[startTimeIdx].includes("PM") ? 12 : 0;
            const endH = parseInt(END_TIMES[endTimeIdx].split(":")[0]);
            const endAmPm = END_TIMES[endTimeIdx].includes("PM") ? 12 : 0;
            if (tripId) {
              store.setPreferences(tripId, {
                pace: paceMap[pace] ?? "moderate",
                walkingTolerance: walkMap[walking] ?? "moderate",
                budget: budgetMap[budget] ?? "medium",
                priorities: Array.from(focusAreas).map(f => f.toLowerCase() as ActivityCategory),
                startTime: `${String(startH + startAmPm).padStart(2, "0")}:00`,
                endTime: `${String(endH + endAmPm).padStart(2, "0")}:00`,
              });
            }
            onBuild();
          }}
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
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(232,93,58,0.22)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(232,93,58,0.30)"; }}
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
            Build Our Itinerary
          </span>
          <span style={{ fontSize: 17 }}>✨</span>
        </button>
      </div>
    </div>
  );
}
