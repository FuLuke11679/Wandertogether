import { useState, useEffect } from "react";
import type { ExtractedPlace } from "../../lib/extracted-place";

export type { ExtractedPlace };

const CORAL = "#E85D3A";
const SAGE  = "#2D5F4E";
const DARK  = "#1A1A1A";

interface Trip {
  id: string;
  name: string;
  emoji: string;
  dates: string;
}

interface Props {
  sourceUrl: string;
  places: ExtractedPlace[];
  onClose: () => void;
  onImport: (places: ExtractedPlace[], tripId: string) => void;
  /** When set, trip picker is hidden and imports target this trip */
  lockedTripId?: string;
  lockedTripName?: string;
  lockedTripEmoji?: string;
}

// ─── Mock trips ───────────────────────────────────────────────────────────────
const TRIPS: Trip[] = [
  { id: "tokyo",  name: "Tokyo Adventure",  emoji: "🗼", dates: "Apr 12–19" },
  { id: "bali",   name: "Bali Escape",       emoji: "🌴", dates: "Jun 3–10"  },
  { id: "paris",  name: "Paris Weekend",     emoji: "🥐", dates: "Aug 22–25" },
];

// ─── Category color map ───────────────────────────────────────────────────────
const CAT: Record<string, { bg: string; text: string }> = {
  Culture:   { bg: "#F0EEF8", text: "#5A4D8A" },
  Food:      { bg: "#FFF0EB", text: "#C44B29" },
  Shopping:  { bg: "#FFF8EB", text: "#A06B20" },
  Nightlife: { bg: "#F8EBF5", text: "#8A3A72" },
  Nature:    { bg: "#F0F8F0", text: "#2D6B3A" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes sheet-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sheet-down {
    from { transform: translateY(0); }
    to   { transform: translateY(100%); }
  }
  @keyframes overlay-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes trip-expand {
    from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
    to   { opacity: 1; transform: translateY(0) scaleY(1); }
  }
  @keyframes success-pop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.08); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .sheet-enter  { animation: sheet-up   0.42s cubic-bezier(0.32,0.72,0,1) forwards; }
  .sheet-exit   { animation: sheet-down 0.34s cubic-bezier(0.32,0.72,0,1) forwards; }
  .overlay-in   { animation: overlay-in  0.28s ease forwards; }
  .overlay-out  { animation: overlay-out 0.28s ease forwards; }
  .trip-expand  { animation: trip-expand 0.22s cubic-bezier(0.22,1,0.36,1) forwards; transform-origin: top center; }
  .success-pop  { animation: success-pop 0.38s cubic-bezier(0.22,1,0.36,1) forwards; }
  .place-row:active { background: #FDFCFB !important; }
`;

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        border: checked ? `2px solid ${CORAL}` : "2px solid #DDD9D3",
        background: checked ? CORAL : "transparent",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.14s ease",
        padding: 0,
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PlaceSelectionSheet({
  sourceUrl,
  places: initialPlaces,
  onClose,
  onImport,
  lockedTripId,
  lockedTripName,
  lockedTripEmoji,
}: Props) {
  const [places, setPlaces]         = useState(initialPlaces);
  const [selectedTrip, setTrip]     = useState<Trip>(TRIPS[0]);
  const [tripPickerOpen, setTripPicker] = useState(false);
  const [exiting, setExiting]       = useState(false);
  const [imported, setImported]     = useState(false);

  const checkedCount = places.filter(p => p.checked).length;

  useEffect(() => {
    if (lockedTripId && lockedTripName) {
      setTrip({
        id: lockedTripId,
        name: lockedTripName,
        emoji: lockedTripEmoji ?? "🗺️",
        dates: "",
      });
    }
  }, [lockedTripId, lockedTripName, lockedTripEmoji]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onClose, 320);
  };

  const toggle = (id: number) =>
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, checked: !p.checked } : p));

  const toggleAll = () => {
    const allChecked = places.every(p => p.checked);
    setPlaces(prev => prev.map(p => ({ ...p, checked: !allChecked })));
  };

  const handleImport = () => {
    setImported(true);
    setTimeout(() => {
      onImport(
        places.filter((p) => p.checked),
        lockedTripId ?? selectedTrip.id,
      );
      dismiss();
    }, 900);
  };

  // derive source label
  const srcLabel = sourceUrl.length > 44 ? sourceUrl.slice(0, 44) + "…" : sourceUrl;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
      <style>{STYLES}</style>

      {/* Backdrop */}
      <div
        className={exiting ? "overlay-out" : "overlay-in"}
        onClick={dismiss}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(20,15,10,0.42)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div
        className={exiting ? "sheet-exit" : "sheet-enter"}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#FAFAF8",
          borderRadius: "22px 22px 0 0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "88%",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#DDD9D3" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "10px 20px 14px", borderBottom: "1px solid #EDE9E4", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 20,
                  color: DARK,
                  margin: "0 0 4px",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                Choose places to import
              </h2>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#A09888", display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1.5A4 4 0 119.5 5.5" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M5.5 1.5V3.5M5.5 5.5l1.5 1.5" stroke="#B0A99F" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {srcLabel}
              </span>
            </div>
            {/* Count badge */}
            <div
              style={{
                background: `${SAGE}12`,
                border: `1px solid ${SAGE}28`,
                borderRadius: 99,
                padding: "5px 11px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 4.5l2.5 2.5 4.5-5" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: SAGE }}>
                {places.length} found
              </span>
            </div>
          </div>
        </div>

        {/* Trip selector */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #EDE9E4", flexShrink: 0, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#A09888", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
              Adding to
            </span>
            {lockedTripId ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "white",
                  border: "1.5px solid #EDE9E4",
                  borderRadius: 10,
                  padding: "7px 11px",
                }}
              >
                <span style={{ fontSize: 15 }}>{selectedTrip.emoji}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: DARK }}>
                  {selectedTrip.name}
                </span>
              </div>
            ) : (
            <button
              onClick={() => setTripPicker(v => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: tripPickerOpen ? "#F5F2EE" : "white",
                border: `1.5px solid ${tripPickerOpen ? CORAL + "60" : "#EDE9E4"}`,
                borderRadius: 10,
                padding: "7px 11px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: 15 }}>{selectedTrip.emoji}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 600, color: DARK }}>
                {selectedTrip.name}
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ transform: tripPickerOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
              >
                <path d="M3.5 5.5l3.5 3.5 3.5-3.5" stroke="#A09888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            )}
          </div>

          {/* Trip dropdown */}
          {!lockedTripId && tripPickerOpen && (
            <div
              className="trip-expand"
              style={{
                position: "absolute",
                top: "calc(100% - 6px)",
                right: 20,
                background: "white",
                borderRadius: 12,
                border: "1.5px solid #EDE9E4",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
                overflow: "hidden",
                zIndex: 10,
                minWidth: 210,
              }}
            >
              {TRIPS.map((trip, i) => (
                <button
                  key={trip.id}
                  onClick={() => { setTrip(trip); setTripPicker(false); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 14px",
                    background: selectedTrip.id === trip.id ? "#FFF5F2" : "white",
                    border: "none",
                    borderBottom: i < TRIPS.length - 1 ? "1px solid #F5F2EE" : "none",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "background 0.12s ease",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{trip.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, fontWeight: 500, color: DARK }}>
                      {trip.name}
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#A09888", marginTop: 1 }}>
                      {trip.dates}
                    </div>
                  </div>
                  {selectedTrip.id === trip.id && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3.5 3.5 5.5-6" stroke={CORAL} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Select all row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: "1px solid #F5F2EE",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#A09888" }}>
            {checkedCount} of {places.length} selected
          </span>
          <button
            onClick={toggleAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: CORAL,
              padding: "2px 0",
            }}
          >
            {places.every(p => p.checked) ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Place list */}
        <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1 } as React.CSSProperties}>
          {places.map((place, i) => {
            const colors = CAT[place.category] ?? { bg: "#F5F3F0", text: "#666" };
            return (
              <div
                key={place.id}
                className="place-row"
                onClick={() => toggle(place.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: i < places.length - 1 ? "1px solid #F8F5F2" : "none",
                  cursor: "pointer",
                  transition: "background 0.1s ease",
                  background: "transparent",
                }}
              >
                <Checkbox checked={place.checked} onChange={() => toggle(place.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      color: place.checked ? DARK : "#C5BEB6",
                      textDecoration: place.checked ? "none" : "line-through",
                      transition: "all 0.14s ease",
                      display: "block",
                      whiteSpace: "nowrap" as const,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {place.name}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: "#B0A99F", marginTop: 1, display: "block" }}>
                    {place.duration}
                  </span>
                </div>
                <div
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    borderRadius: 99,
                    padding: "4px 9px",
                    fontSize: 11.5,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    flexShrink: 0,
                    opacity: place.checked ? 1 : 0.4,
                    transition: "opacity 0.14s ease",
                  }}
                >
                  <span style={{ fontSize: 11 }}>{place.emoji}</span>
                  {place.category}
                </div>
              </div>
            );
          })}
        </div>

        {/* Import CTA */}
        <div
          style={{
            padding: "14px 20px 28px",
            borderTop: "1px solid #EDE9E4",
            flexShrink: 0,
            background: "#FAFAF8",
          }}
        >
          {imported ? (
            <div
              className="success-pop"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 0",
                background: `${SAGE}14`,
                borderRadius: 12,
                border: `1px solid ${SAGE}28`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" fill={SAGE} />
                <path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: SAGE }}>
                Added to {selectedTrip.name}!
              </span>
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={checkedCount === 0}
              style={{
                width: "100%",
                padding: "14px 0",
                background: checkedCount === 0 ? "#EDE9E4" : CORAL,
                border: "none",
                borderRadius: 12,
                cursor: checkedCount === 0 ? "default" : "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: checkedCount === 0 ? "#B0A99F" : "white",
                letterSpacing: "-0.1px",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1v10M3 7.5l4.5 4.5 4.5-4.5" stroke={checkedCount === 0 ? "#B0A99F" : "white"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {checkedCount === 0
                ? "Select places to add"
                : `Add ${checkedCount} place${checkedCount !== 1 ? "s" : ""} to ${selectedTrip.name}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
