import { useTripStore } from "../../lib/store";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const CORAL = "#E85D3A";
const BG = "#FAFAF8";
const DARK = "#1A1A1A";

function IconChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M13.5 5.5L7 11l6.5 5.5"
        stroke={DARK}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const userProfile = useTripStore((s) => s.userProfile);
  const setUserProfile = useTripStore((s) => s.setUserProfile);

  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: BG,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "50px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <IconChevronLeft />
        </button>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 24,
            color: DARK,
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          Profile
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 22px 32px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: "#9A9080",
            margin: "0 0 24px 0",
            lineHeight: 1.45,
          }}
        >
          This info is saved on this device. Email will be used for trip invites later.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label
              htmlFor="profile-name"
              className="font-[Inter,sans-serif] text-[13px] font-semibold text-[#5C564C]"
            >
              Your name
            </Label>
            <Input
              id="profile-name"
              type="text"
              autoComplete="name"
              placeholder="Sarah"
              value={userProfile.displayName}
              onChange={(e) => setUserProfile({ displayName: e.target.value })}
              className="h-11 rounded-xl border-[#E4DFD6] bg-white font-[Inter,sans-serif] text-[15px] text-[#1A1A1A] placeholder:text-[#C5BEB6] focus-visible:border-[#E85D3A] focus-visible:ring-[#E85D3A]/25"
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "#B0A99F",
              }}
            >
              Shown in the home greeting (e.g. “Hey Sarah”).
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Label
              htmlFor="profile-email"
              className="font-[Inter,sans-serif] text-[13px] font-semibold text-[#5C564C]"
            >
              Email
            </Label>
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ email: e.target.value })}
              className="h-11 rounded-xl border-[#E4DFD6] bg-white font-[Inter,sans-serif] text-[15px] text-[#1A1A1A] placeholder:text-[#C5BEB6] focus-visible:border-[#E85D3A] focus-visible:ring-[#E85D3A]/25"
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "#B0A99F",
              }}
            >
              For trip invites — not wired up yet.
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "12px 22px 28px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(250,250,248,0.96)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 14,
            border: "none",
            background: CORAL,
            color: "white",
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(232,93,58,0.28)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
