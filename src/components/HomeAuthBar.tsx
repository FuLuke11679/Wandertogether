import { useState } from "react";
import { useAuth } from "../lib/supabase/auth-context";

const CORAL = "#E85D3A";
const DARK = "#1A1A1A";
const MUTED = "#6B6B6B";
const BORDER = "#E8E6E2";

export function HomeAuthBar() {
  const {
    configured,
    user,
    profileDisplayName,
    authReady,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!configured || !authReady) return null;

  if (user) {
    const label =
      profileDisplayName?.trim() ||
      user.email?.split("@")[0] ||
      "Signed in";
    return (
      <div
        style={{
          margin: "0 22px 12px",
          padding: "10px 12px",
          borderRadius: 12,
          border: `1px solid ${BORDER}`,
          background: "rgba(255,255,255,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: DARK,
            fontWeight: 500,
          }}
        >
          Cloud: {label}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: CORAL,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: "0 22px 12px",
        padding: "12px 12px 14px",
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,0.95)",
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: MUTED,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Sign in for cloud trips
      </div>
      <input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginBottom: 6,
          padding: "10px 11px",
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
        }}
      />
      <input
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginBottom: 8,
          padding: "10px 11px",
          borderRadius: 8,
          border: `1px solid ${BORDER}`,
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
        }}
      />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMessage(null);
            const fn = mode === "signup" ? signUpWithEmail : signInWithEmail;
            const { error } = await fn(email, password);
            setBusy(false);
            if (error) setMessage(error.message);
            else if (mode === "signup") {
              setMessage("Check your email to confirm, then sign in.");
            }
          }}
          style={{
            flex: 1,
            minHeight: 44,
            borderRadius: 10,
            border: "none",
            background: CORAL,
            color: "white",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {mode === "signup" ? "Sign up" : "Sign in"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setMessage(null);
          }}
          style={{
            minHeight: 44,
            padding: "0 12px",
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: "white",
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: DARK,
            cursor: "pointer",
          }}
        >
          {mode === "signup" ? "Have account?" : "New?"}
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          const { error } = await signInWithGoogle();
          setBusy(false);
          if (error) setMessage(error.message);
        }}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          background: "white",
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: DARK,
          cursor: busy ? "wait" : "pointer",
          marginBottom: message ? 8 : 0,
        }}
      >
        Continue with Google
      </button>
      {message && (
        <p
          style={{
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            color: MUTED,
            lineHeight: 1.4,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
