import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTripStore } from "../../lib/store";
import {
  filterCitySuggestions,
  flagForDestination,
  type CitySuggestion,
} from "../../lib/city-suggestions";
import { DatePickerSheet, formatDateShort } from "./DatePickerSheet";

// ─── Design tokens ────────────────────────────────────────────────────────────
const CORAL = "#E85D3A";
const SAGE  = "#2D5F4E";
const DARK  = "#1A1A1A";
const BG    = "#FAFAF8";

const AVATAR_PALETTES = [
  { bg: "#FDDFD4", color: "#C44B29" },
  { bg: "#D4EAE3", color: "#1E5A44" },
  { bg: "#F5ECD4", color: "#8A6020" },
  { bg: "#EAD4F5", color: "#6B2D8A" },
];

const MEMBERS = [
  { initial: "S", name: "Sarah",  pal: 0, isYou: true  },
  { initial: "A", name: "Alex",   pal: 1, isYou: false },
  { initial: "J", name: "Jordan", pal: 2, isYou: false },
];

// ─── Small icon helpers ───────────────────────────────────────────────────────
function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.2" stroke="#C5BEB6" strokeWidth="1.4" />
      <ellipse cx="9" cy="9" rx="3.2" ry="7.2" stroke="#C5BEB6" strokeWidth="1.4" />
      <path d="M1.8 6.3h14.4M1.8 11.7h14.4" stroke="#C5BEB6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1.5" y="2.5" width="12" height="11" rx="2" stroke="#C5BEB6" strokeWidth="1.3" />
      <path d="M1.5 6.5h12" stroke="#C5BEB6" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 1.5v2M10 1.5v2" stroke="#C5BEB6" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 9.5a3.54 3.54 0 005 0l2-2a3.54 3.54 0 00-5-5L7.5 3.5" stroke="#9A9080" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 6.5a3.54 3.54 0 00-5 0l-2 2a3.54 3.54 0 005 5L8.5 12.5" stroke="#9A9080" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.5" stroke="#C5BEB6" strokeWidth="1.3" />
      <path d="M2.5 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#C5BEB6" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function defaultTripDates(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  return { start, end };
}

function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.11em",
        textTransform: "uppercase" as const,
        color: "#9A9080",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────
interface CreateTripSheetProps {
  onClose: () => void;
  onCreate: (tripId: string) => void;
}

export function CreateTripSheet({ onClose, onCreate }: CreateTripSheetProps) {
  const [sheetIn, setSheetIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [destVal, setDestVal] = useState("Tokyo, Japan");
  const [destFocused, setDestFocused] = useState(false);
  const [createPressed, setCreatePressed] = useState(false);
  const [copyPressed, setCopyPressed] = useState(false);
  const [members, setMembers] = useState(MEMBERS);
  const defaults = useMemo(() => defaultTripDates(), []);
  const [startDate, setStartDate] = useState<Date | null>(defaults.start);
  const [endDate, setEndDate] = useState<Date | null>(defaults.end);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateCardHover, setDateCardHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const destMeasureRef = useRef<HTMLDivElement>(null);
  const [cityDropPos, setCityDropPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useTripStore();

  const citySuggestions = useMemo(
    () => filterCitySuggestions(destVal, 8),
    [destVal],
  );
  const showCityList =
    destFocused && destVal.trim().length > 0 && citySuggestions.length > 0;

  // Slide in on mount
  useEffect(() => {
    const t = setTimeout(() => setSheetIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const updateCityDropdownPosition = () => {
    const el = destMeasureRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCityDropPos({ left: r.left, top: r.bottom + 6, width: r.width });
  };

  useLayoutEffect(() => {
    if (!showCityList) {
      setCityDropPos(null);
      return;
    }
    updateCityDropdownPosition();
    const onScrollOrResize = () => updateCityDropdownPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    const ro = new ResizeObserver(onScrollOrResize);
    if (destMeasureRef.current) ro.observe(destMeasureRef.current);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      ro.disconnect();
    };
  }, [showCityList, citySuggestions]);

  const handleClose = () => {
    setSheetIn(false);
    setTimeout(onClose, 380);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCreate = () => {
    if (!startDate || !endDate) return;
    setCreatePressed(true);
    let start = toISODate(startDate);
    let end = toISODate(endDate);
    if (end < start) {
      end = start;
    }
    const tripId = store.createTrip(destVal.split(",")[0].trim(), {
      start,
      end,
    });
    members.filter(m => !m.isYou).forEach((m) => {
      const trips = useTripStore.getState().trips;
      const trip = trips.find(t => t.id === tripId);
      if (trip && !trip.members.some(mem => mem.name === m.name)) {
        useTripStore.setState(s => ({
          trips: s.trips.map(t =>
            t.id === tripId
              ? { ...t, members: [...t.members, { id: m.name.toLowerCase(), name: m.name, initials: m.initial }] }
              : t
          ),
        }));
      }
    });
    setTimeout(() => {
      setSheetIn(false);
      setTimeout(() => onCreate(tripId), 380);
    }, 160);
  };

  const handleAddMember = () => {
    if (!emailVal.trim()) return;
    const initial = emailVal.trim()[0].toUpperCase();
    setMembers(prev => [...prev, { initial, name: emailVal.trim().split("@")[0], pal: prev.length % 4, isYou: false }]);
    setEmailVal("");
    inputRef.current?.focus();
  };

  const sheetH = Math.round(844 * 0.78);

  const pickCity = (c: CitySuggestion) => {
    setDestVal(c.display);
    setDestFocused(false);
    if (blurTimer.current) clearTimeout(blurTimer.current);
  };

  const handleDestBlur = () => {
    blurTimer.current = setTimeout(() => setDestFocused(false), 200);
  };

  const handleDestFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setDestFocused(true);
  };

  // Stagger helper
  const stagger = (i: number): React.CSSProperties => ({
    opacity: sheetIn ? 1 : 0,
    transform: sheetIn ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 0.36s ease ${0.08 + i * 0.055}s, transform 0.36s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.055}s`,
  });

  return (
    <>
      <style>{`
        @keyframes ct-fadein { from { opacity:0 } to { opacity:1 } }
        .ct-input:focus { outline: none; border-color: ${CORAL} !important; box-shadow: 0 0 0 3px ${CORAL}18 !important; }
        .ct-input::placeholder { color: #C5BEB6; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* ── BACKDROP ── */}
      <div
        onClick={handleClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,8,6,0.48)",
          zIndex: 60,
          opacity: sheetIn ? 1 : 0,
          transition: "opacity 0.32s ease",
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
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: sheetIn ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.16), 0 -1px 6px rgba(0,0,0,0.06)",
        }}
      >
        {/* ── DRAG HANDLE ── */}
        <div
          onClick={handleClose}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 4,
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: "#DDD9D3",
            }}
          />
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 8,
          } as React.CSSProperties}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              padding: "10px 22px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...stagger(0),
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 24,
                color: DARK,
                margin: 0,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              Create a Trip
            </h2>
            {/* Close X */}
            <button
              onClick={handleClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#EFECEA",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="#8A8278" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* ── DESTINATION ── */}
          <div style={{ padding: "0 22px 20px", ...stagger(1) }}>
            <SectionLabel>Destination</SectionLabel>
            <div ref={destMeasureRef} style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                <IconGlobe />
              </div>

              <input
                className="ct-input"
                value={destVal}
                onChange={(e) => setDestVal(e.target.value)}
                onFocus={handleDestFocus}
                onBlur={handleDestBlur}
                placeholder="Where are you going?"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={showCityList}
                style={{
                  width: "100%",
                  boxSizing: "border-box" as const,
                  padding: "13px 44px 13px 42px",
                  borderRadius: 14,
                  border: `1.5px solid ${showCityList ? CORAL : "#E8E4DE"}`,
                  background: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  fontWeight: destVal ? 500 : 400,
                  color: DARK,
                  boxShadow: showCityList
                    ? `0 2px 8px rgba(0,0,0,0.04), 0 0 0 3px ${CORAL}18`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                }}
              />

              {destVal && (
                <div
                  style={{
                    position: "absolute",
                    right: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {flagForDestination(destVal)}
                </div>
              )}

            </div>
          </div>

          {showCityList &&
            cityDropPos &&
            createPortal(
              <div
                role="listbox"
                style={{
                  position: "fixed",
                  left: cityDropPos.left,
                  top: cityDropPos.top,
                  width: cityDropPos.width,
                  zIndex: 100000,
                  background: "#FFFFFF",
                  border: "1.5px solid #E8E4DE",
                  borderRadius: 14,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                {citySuggestions.map((c) => (
                  <button
                    key={c.display}
                    type="button"
                    role="option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickCity(c);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left" as const,
                      padding: "11px 14px",
                      border: "none",
                      borderBottom: "1px solid #F5F2EE",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      color: DARK,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>
                      {flagForDestination(c.display)}
                    </span>
                    <span style={{ fontWeight: 500 }}>{c.display}</span>
                  </button>
                ))}
              </div>,
              document.body,
            )}

          {/* ── DATE RANGE (single card → calendar sheet) ── */}
          <div style={{ padding: "0 22px 20px", ...stagger(2) }}>
            <SectionLabel>Dates</SectionLabel>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11.5,
                color: "#A09888",
                margin: "0 0 10px",
                lineHeight: 1.4,
              }}
            >
              Tap to choose your trip start and end. Tap a selected day again to
              adjust or clear the range.
            </p>
            <button
              type="button"
              onClick={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                setDestFocused(false);
                setDatePickerOpen(true);
              }}
              onMouseEnter={() => setDateCardHover(true)}
              onMouseLeave={() => setDateCardHover(false)}
              style={{
                width: "100%",
                textAlign: "left" as const,
                cursor: "pointer",
                display: "block",
                background: "#FFFFFF",
                border: `1.5px solid ${dateCardHover ? `${CORAL}60` : "#E8E4DE"}`,
                borderRadius: 14,
                padding: "14px 16px 16px",
                boxShadow: dateCardHover
                  ? "0 4px 16px rgba(0,0,0,0.08)"
                  : "0 2px 8px rgba(0,0,0,0.04)",
                transform: dateCardHover ? "translateY(-2px)" : "translateY(0)",
                transition:
                  "border-color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <IconCalendar />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "#B0A99F",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Trip duration
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#B0A99F",
                      marginBottom: 4,
                    }}
                  >
                    FROM
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 22,
                      color: startDate ? DARK : "#C5BEB6",
                      lineHeight: 1.15,
                    }}
                  >
                    {startDate ? formatDateShort(startDate) : "—"}
                  </div>
                </div>
                <svg
                  width="28"
                  height="16"
                  viewBox="0 0 28 16"
                  fill="none"
                  aria-hidden
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M4 8h20M18 4l4 4-4 4"
                    stroke={CORAL}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div style={{ flex: 1, minWidth: 0, textAlign: "right" as const }}>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      color: "#B0A99F",
                      marginBottom: 4,
                    }}
                  >
                    TO
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 22,
                      color: endDate ? DARK : "#C5BEB6",
                      lineHeight: 1.15,
                    }}
                  >
                    {endDate ? formatDateShort(endDate) : "—"}
                  </div>
                </div>
              </div>
              {startDate && endDate && (
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: "#9A9080",
                    marginTop: 12,
                  }}
                >
                  {startDate.getFullYear() === endDate.getFullYear()
                    ? String(startDate.getFullYear())
                    : `${startDate.getFullYear()} → ${endDate.getFullYear()}`}
                </div>
              )}
            </button>
          </div>

          {/* ── INVITE MEMBERS ── */}
          <div style={{ padding: "0 22px 20px", ...stagger(3) }}>
            <SectionLabel>Who's coming?</SectionLabel>

            {/* Avatar row */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                marginBottom: 14,
                flexWrap: "wrap" as const,
              }}
            >
              {members.map((m, i) => {
                const pal = AVATAR_PALETTES[m.pal];
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: pal.bg,
                          border: m.isYou ? `2px solid ${CORAL}` : "2px solid #EDE9E4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: m.isYou ? `0 0 0 3px ${CORAL}20` : "none",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: pal.color,
                          }}
                        >
                          {m.initial}
                        </span>
                      </div>
                      {/* Remove badge for non-you members */}
                      {!m.isYou && (
                        <div
                          onClick={() => setMembers(prev => prev.filter((_, idx) => idx !== i))}
                          style={{
                            position: "absolute",
                            top: -2,
                            right: -2,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#EDE9E4",
                            border: "1.5px solid white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                            <path d="M1 1l5 5M6 1L1 6" stroke="#8A8278" strokeWidth="1.2" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 10.5,
                        color: m.isYou ? CORAL : "#7A7268",
                        fontWeight: m.isYou ? 600 : 400,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {m.isYou ? "You" : m.name}
                    </span>
                  </div>
                );
              })}

              {/* Add more dashed circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div
                  onClick={() => inputRef.current?.focus()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "1.8px dashed #D8D4CE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "transparent",
                    transition: "border-color 0.15s ease, background 0.15s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = CORAL; (e.currentTarget as HTMLDivElement).style.background = `${CORAL}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#D8D4CE"; (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
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
                    fontWeight: 400,
                  }}
                >
                  Add
                </span>
              </div>
            </div>

            {/* Email input */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 13,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <IconUser />
              </div>
              <input
                ref={inputRef}
                className="ct-input"
                value={emailVal}
                onChange={e => setEmailVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddMember()}
                placeholder="Add by name or email..."
                style={{
                  width: "100%",
                  boxSizing: "border-box" as const,
                  padding: "11px 52px 11px 36px",
                  borderRadius: 12,
                  border: "1.5px solid #E8E4DE",
                  background: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13.5,
                  color: DARK,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                }}
              />
              {/* Return / Add button inside field */}
              {emailVal.trim() && (
                <button
                  onClick={handleAddMember}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: CORAL,
                    border: "none",
                    borderRadius: 8,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* ── SHARE LINK ── */}
          <div style={{ padding: "0 22px 24px", ...stagger(4) }}>
            <SectionLabel>Share link</SectionLabel>
            <div
              style={{
                background: "#FFFFFF",
                border: "1.5px solid #E8E4DE",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Link row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  gap: 10,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <IconLink />
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13.5,
                    color: "#5A5248",
                    fontWeight: 500,
                    flex: 1,
                    letterSpacing: "0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  wandersync.app/trip/xK3m
                </span>
                <button
                  onMouseDown={() => setCopyPressed(true)}
                  onMouseUp={() => { setCopyPressed(false); handleCopy(); }}
                  onMouseLeave={() => setCopyPressed(false)}
                  onTouchStart={() => setCopyPressed(true)}
                  onTouchEnd={() => { setCopyPressed(false); handleCopy(); }}
                  style={{
                    background: copied ? `${SAGE}18` : `${CORAL}14`,
                    border: `1px solid ${copied ? `${SAGE}40` : `${CORAL}35`}`,
                    borderRadius: 8,
                    padding: "5px 12px",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: copied ? SAGE : CORAL,
                    letterSpacing: "0.02em",
                    flexShrink: 0,
                    transform: copyPressed ? "scale(0.94)" : "scale(1)",
                    transition: "transform 0.1s ease, background 0.2s ease, color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-5" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copied
                    </>
                  ) : "Copy"}
                </button>
              </div>

              {/* Divider + subtitle */}
              <div
                style={{
                  borderTop: "1px solid #F0EDE9",
                  padding: "9px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#C5BEB6" strokeWidth="1.2" />
                  <path d="M6 5.5V9M6 3.5v.5" stroke="#C5BEB6" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11.5,
                    color: "#A09888",
                    lineHeight: 1.4,
                  }}
                >
                  Share this link so friends can join and vote
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY FOOTER ── */}
        <div
          style={{
            padding: "10px 22px 32px",
            background: BG,
            borderTop: "1px solid #EDE9E4",
            flexShrink: 0,
            ...stagger(5),
          }}
        >
          <button
            onMouseDown={() => setCreatePressed(true)}
            onMouseUp={() => { setCreatePressed(false); handleCreate(); }}
            onMouseLeave={() => setCreatePressed(false)}
            onTouchStart={() => setCreatePressed(true)}
            onTouchEnd={() => { setCreatePressed(false); handleCreate(); }}
            style={{
              width: "100%",
              padding: "15px 24px",
              background: createPressed
                ? "#D44F2E"
                : `linear-gradient(135deg, ${CORAL} 0%, #F0703A 100%)`,
              border: "none",
              borderRadius: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transform: createPressed ? "scale(0.98)" : "scale(1)",
              transition: "transform 0.12s ease, box-shadow 0.12s ease",
              boxShadow: createPressed
                ? "0 2px 8px rgba(232,93,58,0.18)"
                : "0 6px 24px rgba(232,93,58,0.34), 0 2px 6px rgba(232,93,58,0.20)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15.5,
                fontWeight: 600,
                color: "white",
                letterSpacing: "0.01em",
              }}
            >
              Create Trip
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {datePickerOpen && (
        <DatePickerSheet
          initialStart={startDate}
          initialEnd={endDate}
          onClose={() => setDatePickerOpen(false)}
          onConfirm={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />
      )}
    </>
  );
}
