import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const CORAL = "#E85D3A";
const SAGE = "#2D5F4E";
const DARK = "#1A1A1A";
const BG = "#FAFAF8";

export interface DatePickerSheetProps {
  onClose: () => void;
  onConfirm: (start: Date, end: Date) => void;
  initialStart: Date | null;
  initialEnd: Date | null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatYear(d: Date): number {
  return d.getFullYear();
}

function isSameDay(d1: Date | null, d2: Date | null): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isInRange(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const t = startOfDay(day).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return t > s && t < e;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Sunday = 0 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePickerSheet({
  onClose,
  onConfirm,
  initialStart,
  initialEnd,
}: DatePickerSheetProps) {
  const [sheetIn, setSheetIn] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    initialStart ? startOfDay(initialStart) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEnd ? startOfDay(initialEnd) : null,
  );

  const initialView = initialStart ?? initialEnd ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    const t = setTimeout(() => setSheetIn(true), 30);
    return () => clearTimeout(t);
  }, []);

  const stagger = (i: number): React.CSSProperties => ({
    opacity: sheetIn ? 1 : 0,
    transform: sheetIn ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 0.36s ease ${0.08 + i * 0.05}s, transform 0.36s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.05}s`,
  });

  /** Tall enough for month grid + confirm without scroll on typical laptops; capped so it stays modal-sized. */
  const sheetBox: React.CSSProperties = {
    height: "min(58vh, 480px)",
    maxHeight: "min(58vh, 480px)",
    width: "min(100%, 400px)",
    marginLeft: "auto",
    marginRight: "auto",
  };

  const handleClose = () => {
    setSheetIn(false);
    setTimeout(onClose, 380);
  };

  const handleDayClick = (day: number) => {
    const clicked = startOfDay(new Date(viewYear, viewMonth, day));
    const today = startOfDay(new Date());
    if (clicked < today) return;

    const s = startDate ? startOfDay(startDate) : null;
    const e = endDate ? startOfDay(endDate) : null;

    if (s && !e && isSameDay(clicked, s)) {
      setStartDate(null);
      return;
    }

    if (s && e) {
      if (isSameDay(s, e) && isSameDay(clicked, s)) {
        setStartDate(null);
        setEndDate(null);
        return;
      }
      if (!isSameDay(s, e) && isSameDay(clicked, e)) {
        setEndDate(null);
        return;
      }
      if (!isSameDay(s, e) && isSameDay(clicked, s)) {
        setStartDate(null);
        setEndDate(null);
        return;
      }
      setStartDate(clicked);
      setEndDate(null);
      return;
    }

    if (s && !e) {
      if (clicked < s) {
        setEndDate(s);
        setStartDate(clicked);
      } else {
        setEndDate(clicked);
      }
      return;
    }

    setStartDate(clicked);
    setEndDate(null);
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [viewYear, viewMonth],
  );

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const first = getFirstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const today = startOfDay(new Date());
  const canConfirm = Boolean(startDate && endDate);

  const ui = (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,8,6,0.48)",
          zIndex: 100080,
          opacity: sheetIn ? 1 : 0,
          transition: "opacity 0.32s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          ...sheetBox,
          background: BG,
          borderRadius: "20px 20px 0 0",
          zIndex: 100090,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          transform: sheetIn ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow: "0 -8px 48px rgba(0,0,0,0.16), 0 -1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 12,
            paddingBottom: 4,
            flexShrink: 0,
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

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            paddingBottom: 16,
          } as React.CSSProperties}
        >
          <div
            style={{
              padding: "8px 22px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...stagger(0),
            }}
          >
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22,
                color: DARK,
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              Trip dates
            </h2>
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#EFECEA",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Close"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="#8A8278" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div style={{ padding: "0 22px 14px", ...stagger(1) }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1.5px solid #E8E4DE",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
                    fontSize: 20,
                    color: startDate ? DARK : "#C5BEB6",
                    lineHeight: 1.2,
                  }}
                >
                  {startDate ? formatDateShort(startDate) : "—"}
                </div>
              </div>
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden>
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
                    fontSize: 20,
                    color: endDate ? DARK : "#C5BEB6",
                    lineHeight: 1.2,
                  }}
                >
                  {endDate ? formatDateShort(endDate) : "—"}
                </div>
              </div>
            </div>
            {(startDate || endDate) && (
              <div
                style={{
                  textAlign: "center",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: "#9A9080",
                  marginTop: 8,
                }}
              >
                {startDate && endDate && formatYear(startDate) !== formatYear(endDate)
                  ? `${formatYear(startDate)} → ${formatYear(endDate)}`
                  : formatYear(startDate ?? endDate!)}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "0 22px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...stagger(2),
            }}
          >
            <button
              type="button"
              onClick={goPrevMonth}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1.5px solid #E8E4DE",
                background: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              aria-label="Previous month"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9l5 5" stroke={SAGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: DARK,
              }}
            >
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: "1.5px solid #E8E4DE",
                background: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              aria-label="Next month"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 4l5 5-5 5" stroke={SAGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div style={{ padding: "0 22px", ...stagger(3) }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                marginBottom: 8,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d, wi) => (
                <div
                  key={`w-${wi}`}
                  style={{
                    textAlign: "center",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#B0A99F",
                    letterSpacing: "0.04em",
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} style={{ aspectRatio: "1", minHeight: 40 }} />;
                }
                const dateObj = new Date(viewYear, viewMonth, day);
                const cell = startOfDay(dateObj);
                const past = cell < today;
                const isStart = startDate && isSameDay(cell, startDate);
                const isEnd = endDate && isSameDay(cell, endDate);
                const inRange = isInRange(cell, startDate, endDate);
                const isTodayCell = isSameDay(cell, today);
                const selected = Boolean(isStart || isEnd);

                let bg = "#FFFFFF";
                let color = DARK;
                let border = "1.5px solid transparent";
                let boxShadow = "none";
                if (past) {
                  bg = "transparent";
                  color = "#C5BEB6";
                } else if (selected) {
                  bg = CORAL;
                  color = "#FFFFFF";
                  border = `1.5px solid ${CORAL}`;
                  boxShadow = "0 2px 8px rgba(232, 93, 58, 0.35)";
                } else if (inRange) {
                  bg = `${CORAL}18`;
                  color = CORAL;
                } else if (isTodayCell) {
                  border = `1.5px solid ${CORAL}80`;
                }

                return (
                  <button
                    key={`d-${day}`}
                    type="button"
                    disabled={past}
                    onClick={() => handleDayClick(day)}
                    style={{
                      aspectRatio: "1",
                      minHeight: 40,
                      borderRadius: 10,
                      border,
                      background: bg,
                      color,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: past ? "default" : "pointer",
                      opacity: past ? 0.4 : 1,
                      boxShadow,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "16px 22px 8px", ...stagger(4) }}>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => {
                if (startDate && endDate) {
                  onConfirm(startDate, endDate);
                  setSheetIn(false);
                  setTimeout(onClose, 380);
                }
              }}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 14,
                border: "none",
                cursor: canConfirm ? "pointer" : "not-allowed",
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#FFFFFF",
                background: canConfirm
                  ? `linear-gradient(180deg, ${CORAL} 0%, #D14A28 100%)`
                  : "#DDD9D3",
                boxShadow: canConfirm ? "0 4px 16px rgba(232, 93, 58, 0.35)" : "none",
                opacity: canConfirm ? 1 : 0.85,
              }}
            >
              Confirm dates
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(ui, document.body);
}
