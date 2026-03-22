import { useState, useEffect, useRef } from "react";
import { useTripStore } from "../../lib/store";
import type { ItineraryStop, SalvageReason } from "../../lib/types";

const CORAL = "#E85D3A";
const SAGE  = "#2D5F4E";
const DARK  = "#1A1A1A";
const BG    = "#FAFAF8";

type Step = "reason" | "chat" | "comparison";

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

const REASONS: {
  id: SalvageReason;
  label: string;
  emoji: string;
  tint: string;
  border: string;
}[] = [
  { id: "late",    label: "Running late",    emoji: "⏰", tint: "#FFF3E0", border: "#FFDCAD" },
  { id: "weather", label: "Weather changed", emoji: "🌧️", tint: "#E3F2FD", border: "#AACDE8" },
  { id: "tired",   label: "I'm tired",       emoji: "😴", tint: "#F3E5F5", border: "#D8BDED" },
  { id: "other",   label: "Something else",  emoji: "✏️", tint: "#F5F3F0", border: "#DDD9D4" },
];

const AI_OPENERS: Record<SalvageReason, string> = {
  late:    "Got it — you're running behind. Tell me more so I can adjust your day (e.g. how late are you, any stops you still really want to hit?)",
  weather: "Weather's not cooperating! Describe what's going on (rain, extreme heat, etc.) and I'll find the best indoor alternatives.",
  tired:   "Totally fair — long day! Let me know what you're feeling (need a café break, want to cut the day short?) and I'll lighten things up.",
  other:   "No worries, plans change! Tell me what's going on and I'll rework the rest of your day.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReasonCard({
  reason,
  onSelect,
  delay,
  sheetVisible,
}: {
  reason: typeof REASONS[0];
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
        background: "#FFFFFF",
        border: `1.5px solid ${reason.border}`,
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease",
        transform: pressed ? "scale(0.96)" : "scale(1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        opacity: sheetVisible ? 1 : 0,
        transitionDelay: `${delay}s`,
        WebkitTapHighlightColor: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{reason.emoji}</span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12.5,
          fontWeight: 600,
          color: "#5A5248",
          letterSpacing: "-0.1px",
          lineHeight: 1.25,
        }}
      >
        {reason.label}
      </span>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C5BEB6",
            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: "linear-gradient(135deg, #FFF0EB 0%, #FDDDD4 100%)",
          border: "1.5px solid rgba(232,93,58,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5L8.5 5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5L2 5h3.5L7 1.5z" fill={CORAL} opacity="0.9" />
        </svg>
      </div>
      <div
        style={{
          background: "white",
          border: "1.5px solid #EDE9E4",
          borderRadius: "4px 14px 14px 14px",
          padding: "10px 13px",
          maxWidth: "82%",
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "#5A5248",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
      <div
        style={{
          background: CORAL,
          borderRadius: "14px 4px 14px 14px",
          padding: "10px 13px",
          maxWidth: "82%",
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: "white",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

// ─── Comparison helpers ───────────────────────────────────────────────────────

type CompRow = {
  key: string;
  wasName: string | null;
  wasEmoji: string;
  nowName: string | null;
  nowEmoji: string;
  changed: boolean;
};

function buildComparisonRows(
  originalStops: ItineraryStop[],
  newStops: ItineraryStop[],
): CompRow[] {
  const rows: CompRow[] = [];
  const newMap = new Map(newStops.map((s) => [s.activity.id, s]));
  const originalMap = new Map(originalStops.map((s) => [s.activity.id, s]));
  const seen = new Set<string>();

  for (const orig of originalStops) {
    const id = orig.activity.id;
    seen.add(id);
    const replacement = newMap.get(id);
    if (replacement) {
      rows.push({
        key: id,
        wasName: orig.activity.name,
        wasEmoji: orig.activity.emoji ?? "📍",
        nowName: replacement.activity.name,
        nowEmoji: replacement.activity.emoji ?? "📍",
        changed: false,
      });
    } else {
      rows.push({
        key: id,
        wasName: orig.activity.name,
        wasEmoji: orig.activity.emoji ?? "📍",
        nowName: null,
        nowEmoji: "",
        changed: true,
      });
    }
  }

  for (const ns of newStops) {
    if (!seen.has(ns.activity.id)) {
      rows.push({
        key: ns.activity.id,
        wasName: null,
        wasEmoji: "",
        nowName: ns.activity.name,
        nowEmoji: ns.activity.emoji ?? "📍",
        changed: true,
      });
    }
  }

  const removedFromOriginal = rows.filter((r) => r.wasName && !r.nowName);
  const addedNew = rows.filter((r) => !r.wasName && r.nowName);
  if (removedFromOriginal.length > 0 && addedNew.length > 0) {
    const merged: CompRow[] = [];
    const addQueue = [...addedNew];
    for (const row of rows) {
      if (!row.wasName && row.nowName) continue;
      if (row.wasName && !row.nowName && addQueue.length > 0) {
        const add = addQueue.shift()!;
        merged.push({
          key: row.key + "-" + add.key,
          wasName: row.wasName,
          wasEmoji: row.wasEmoji,
          nowName: add.nowName,
          nowEmoji: add.nowEmoji,
          changed: true,
        });
      } else {
        merged.push(row);
      }
    }
    for (const leftover of addQueue) {
      merged.push(leftover);
    }
    return merged;
  }

  return rows;
}

function ComparisonRow({ row, delay, visible }: { row: CompRow; delay: number; visible: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
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
          background: row.changed ? "rgba(0,0,0,0.025)" : "#F7F5F2",
          opacity: row.changed ? 0.45 : 1,
          minHeight: 38,
        }}
      >
        {row.wasName ? (
          <>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{row.wasEmoji}</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11.5,
                fontWeight: 500,
                color: row.changed ? "#7A7268" : "#4A4540",
                textDecoration: row.changed ? "line-through" : "none",
                textDecorationColor: "#A09888",
                lineHeight: 1.3,
                letterSpacing: "-0.1px",
              }}
            >
              {row.wasName}
            </span>
          </>
        ) : (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#C5BEB6", fontStyle: "italic" }}>—</span>
        )}
      </div>

      {/* NOW */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 10px",
          borderRadius: 10,
          background: row.changed ? "rgba(45,95,78,0.06)" : "#F7F5F2",
          border: row.changed ? "1px solid rgba(45,95,78,0.14)" : "none",
          minHeight: 38,
        }}
      >
        {row.nowName ? (
          <>
            <span style={{ fontSize: 13, flexShrink: 0 }}>{row.nowEmoji}</span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11.5,
                fontWeight: row.changed ? 600 : 500,
                color: row.changed ? SAGE : "#4A4540",
                lineHeight: 1.3,
                letterSpacing: "-0.1px",
                flex: 1,
                minWidth: 0,
              }}
            >
              {row.nowName}
            </span>
            {row.changed && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  color: SAGE,
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
          </>
        ) : (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              color: "#C5BEB6",
              fontStyle: "italic",
            }}
          >
            Removed
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
  const store = useTripStore();
  const trip = store.getTrip(tripId);
  const originalStops = trip
    ? trip.itinerary[store.execution.activeDayIndex]?.stops ?? []
    : [];

  const [sheetVisible, setSheetVisible] = useState(false);
  const [step, setStep]                 = useState<Step>("reason");
  const [selectedReason, setReason]     = useState<SalvageReason | null>(null);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [inputText, setInputText]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [newStops, setNewStops]         = useState<ItineraryStop[]>([]);
  const [accepted, setAccepted]         = useState(false);
  const [pressedBtn, setPressedBtn]     = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setSheetVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClose = () => {
    setSheetVisible(false);
    setTimeout(() => onClose(), 340);
  };

  const selectReason = (reason: SalvageReason) => {
    setReason(reason);
    setMessages([{ role: "ai", text: AI_OPENERS[reason] }]);
    setStep("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const callAdapt = async (detail?: string) => {
    if (!selectedReason) return;
    setLoading(true);
    try {
      const result = await store.adaptTripLLM(tripId, selectedReason, detail);
      setMessages((prev) => [...prev, { role: "ai", text: result.message }]);
      setNewStops(result.stops);
      setTimeout(() => setStep("comparison"), 800);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong — I've built a backup plan from your remaining stops." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputText("");
    callAdapt(text);
  };

  const handleSkip = () => {
    if (loading) return;
    callAdapt();
  };

  const handleAccept = () => {
    if (newStops.length > 0) {
      store.applySalvage(tripId, newStops);
    }
    setAccepted(true);
    setTimeout(() => onAccept(), 700);
  };

  const sheetH = Math.round(844 * 0.81);

  const compRows = buildComparisonRows(originalStops, newStops);
  const changedCount = compRows.filter((r) => r.changed).length;
  const unchangedCount = compRows.filter((r) => !r.changed).length;

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
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
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
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "#DDD9D3" }} />
        </div>

        {/* ── HEADER ── */}
        <div
          style={{
            padding: "6px 22px 0",
            flexShrink: 0,
            opacity: sheetVisible ? 1 : 0,
            transform: sheetVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.38s ease 0.06s, transform 0.38s cubic-bezier(0.22,1,0.36,1) 0.06s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            {step !== "reason" && (
              <button
                onClick={() => {
                  if (step === "chat") { setStep("reason"); setReason(null); setMessages([]); }
                  else if (step === "comparison") setStep("chat");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 4px 2px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 4L6 8l4 4" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
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
            {selectedReason && step !== "reason" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  color: "#5A5248",
                  background: REASONS.find((r) => r.id === selectedReason)?.tint ?? "#F5F3F0",
                  border: `1px solid ${REASONS.find((r) => r.id === selectedReason)?.border ?? "#DDD9D4"}`,
                  borderRadius: 6,
                  padding: "3px 7px",
                }}
              >
                {REASONS.find((r) => r.id === selectedReason)?.emoji}{" "}
                {REASONS.find((r) => r.id === selectedReason)?.label}
              </span>
            )}
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 600,
              color: DARK,
              margin: "0 0 3px 0",
              lineHeight: 1.2,
              letterSpacing: "-0.3px",
            }}
          >
            {step === "reason" && "Let's adjust your day"}
            {step === "chat" && "Tell us what happened"}
            {step === "comparison" && "Your new plan"}
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13.5,
              color: "#8A8278",
              margin: "0 0 12px 0",
              fontWeight: 400,
            }}
          >
            {step === "reason" && "What happened?"}
            {step === "chat" && "Give WanderAI some details so it can tailor your new plan."}
            {step === "comparison" && `${changedCount} change${changedCount !== 1 ? "s" : ""} suggested`}
          </p>
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
          {/* ══════════ STEP 1: REASON PICKER ══════════ */}
          {step === "reason" && (
            <div style={{ padding: "4px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {REASONS.map((r, i) => (
                <ReasonCard
                  key={r.id}
                  reason={r}
                  onSelect={() => selectReason(r.id)}
                  delay={0.10 + i * 0.055}
                  sheetVisible={sheetVisible}
                />
              ))}
            </div>
          )}

          {/* ══════════ STEP 2: CHAT ══════════ */}
          {step === "chat" && (
            <div style={{ padding: "4px 22px 0", display: "flex", flexDirection: "column" }}>
              {messages.map((m, i) =>
                m.role === "ai" ? <AiBubble key={i} text={m.text} /> : <UserBubble key={i} text={m.text} />,
              )}
              {loading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      background: "linear-gradient(135deg, #FFF0EB 0%, #FDDDD4 100%)",
                      border: "1.5px solid rgba(232,93,58,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1.5L8.5 5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5L2 5h3.5L7 1.5z" fill={CORAL} opacity="0.9" />
                    </svg>
                  </div>
                  <div
                    style={{
                      background: "white",
                      border: "1.5px solid #EDE9E4",
                      borderRadius: "4px 14px 14px 14px",
                      padding: "10px 16px",
                    }}
                  >
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* ══════════ STEP 3: COMPARISON ══════════ */}
          {step === "comparison" && (
            <div style={{ padding: "0 22px" }}>
              {/* AI summary */}
              {messages.length > 0 && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#FFFFFF",
                    borderRadius: 14,
                    border: "1.5px solid #EDE9E4",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        background: "linear-gradient(135deg, #FFF0EB 0%, #FDDDD4 100%)",
                        border: "1.5px solid rgba(232,93,58,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1.5L8.5 5H12L9 7.5l1 3.5L7 9l-3 2 1-3.5L2 5h3.5L7 1.5z" fill={CORAL} opacity="0.9" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10.5, fontWeight: 700, color: CORAL, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          WanderAI
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#5A5248", margin: 0, lineHeight: 1.55 }}>
                        {messages[messages.length - 1]?.role === "ai" ? messages[messages.length - 1].text : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Was / Now headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.10em", color: "#B0A99F", textTransform: "uppercase", flexShrink: 0 }}>
                    Was
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.10em", color: SAGE, textTransform: "uppercase", flexShrink: 0 }}>
                    Now
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                </div>
              </div>

              {/* Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {compRows.map((row, i) => (
                  <ComparisonRow key={row.key} row={row} delay={0.06 + i * 0.05} visible={sheetVisible} />
                ))}
              </div>

              {unchangedCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0", opacity: 0.6 }}>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9.5, color: "#C5BEB6", letterSpacing: "0.08em", flexShrink: 0 }}>
                    {unchangedCount} stop{unchangedCount !== 1 ? "s" : ""} unchanged
                  </span>
                  <div style={{ flex: 1, height: 1, background: "#EDE9E4" }} />
                </div>
              )}
            </div>
          )}
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
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: "white", margin: "0 0 6px 0", letterSpacing: "-0.2px" }}>
                New plan accepted!
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.72)", margin: 0 }}>
                Updating your itinerary…
              </p>
            </div>
          </div>
        )}

        {/* ── BOTTOM ACTIONS ── */}
        <div
          style={{
            padding: step === "chat" ? "8px 22px 28px" : "10px 22px 36px",
            background: BG,
            borderTop: "1px solid #EDE9E4",
            flexShrink: 0,
            opacity: sheetVisible ? 1 : 0,
            transform: sheetVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.38s ease 0.35s, transform 0.38s cubic-bezier(0.22,1,0.36,1) 0.35s",
          }}
        >
          {step === "chat" && (
            <>
              {/* Input row */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Describe your situation…"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #EDE9E4",
                    background: "white",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13.5,
                    color: DARK,
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = CORAL)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#EDE9E4")}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || loading}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: inputText.trim() && !loading ? CORAL : "#EDE9E4",
                    border: "none",
                    cursor: inputText.trim() && !loading ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s ease",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 2L7 9M14 2l-4.5 12L7 9M14 2L2 6.5 7 9" stroke={inputText.trim() && !loading ? "white" : "#B0A99F"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {/* Skip link */}
              <button
                onClick={handleSkip}
                disabled={loading}
                style={{
                  background: "none",
                  border: "none",
                  cursor: loading ? "default" : "pointer",
                  width: "100%",
                  padding: "4px 0",
                  opacity: loading ? 0.4 : 1,
                  transition: "opacity 0.15s ease",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "#A09888",
                    letterSpacing: "0.01em",
                  }}
                >
                  Skip details — just adjust my plan
                </span>
              </button>
            </>
          )}

          {step === "comparison" && (
            <>
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
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: "white", letterSpacing: "0.01em" }}>
                  Accept New Plan
                </span>
                <span style={{ fontSize: 15 }}>✓</span>
              </button>

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
                <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 14, color: "#A09888", letterSpacing: "0.01em" }}>
                  Keep original plan
                </span>
              </button>
            </>
          )}

          {step === "reason" && (
            <button
              onClick={handleClose}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 14, color: "#A09888", letterSpacing: "0.01em" }}>
                Never mind, keep my plan
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
