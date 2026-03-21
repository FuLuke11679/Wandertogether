import { useState } from "react";
import { HomeScreen }                from "./components/HomeScreen";
import { ImportScreen }              from "./components/ImportScreen";
import { VotingScreen }              from "./components/VotingScreen";
import { ResultsScreen }             from "./components/ResultsScreen";
import { PreferencesScreen }         from "./components/PreferencesScreen";
import { BuildingItineraryScreen }   from "./components/BuildingItineraryScreen";
import { ItineraryScreen }           from "./components/ItineraryScreen";
import { ExecutionScreen }           from "./components/ExecutionScreen";
import { SalvageModeSheet }          from "./components/SalvageModeSheet";

// ─── Screen map ───────────────────────────────────────────────────────────────
// home → (tap existing trip) → voting
// home → (+ New Trip / CreateTripSheet) → import → voting (auto after import)
// voting → (auto after final comparison) → results
// results → preferences → building (auto 2.8s) → itinerary
// itinerary → (back) → preferences  |  (Start Day) → execution
// execution ↔ salvage  (salvage resolves back to itinerary)

type Screen =
  | "home"
  | "import"
  | "voting"
  | "results"
  | "preferences"
  | "building"
  | "itinerary"
  | "execution";

export default function App() {
  const [screen, setScreen]           = useState<Screen>("home");
  const [salvageOpen, setSalvageOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#EDEAE4" }}
    >
      {/* ── Phone shell ── */}
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >

        {/* ── Screen 1: Home ── */}
        {screen === "home" && (
          <HomeScreen
            onOpenTrip={() => setScreen("voting")}      // existing trip → straight to voting (demo shortcut)
            onOpenImport={() => setScreen("import")}    // Import tab
            onCreateTrip={() => setScreen("import")}    // New Trip modal → import first
          />
        )}

        {/* ── Screen 2: Import content ── */}
        {screen === "import" && (
          <ImportScreen
            onBack={() => setScreen("home")}
            onGoHome={() => setScreen("home")}
            onContinueToVoting={() => setScreen("voting")}  // confirmed import → voting
          />
        )}

        {/* ── Screen 3: Pairwise voting ── */}
        {screen === "voting" && (
          <VotingScreen
            onBack={() => setScreen("home")}
            onSeeResults={() => setScreen("results")}    // auto-fires after final comparison
          />
        )}

        {/* ── Screen 4: Group results ── */}
        {screen === "results" && (
          <ResultsScreen
            onBack={() => setScreen("voting")}
            onSetPreferences={() => setScreen("preferences")}
          />
        )}

        {/* ── Screen 5: Preferences ── */}
        {screen === "preferences" && (
          <PreferencesScreen
            onBack={() => setScreen("results")}
            onBuild={() => setScreen("building")}         // kicks off loading moment
          />
        )}

        {/* ── Screen 5→6 transition: "Building your perfect day…" ── */}
        {screen === "building" && (
          <BuildingItineraryScreen
            onComplete={() => setScreen("itinerary")}   // auto after ~2.8s
          />
        )}

        {/* ── Screen 6: Day itinerary ── */}
        {screen === "itinerary" && (
          <ItineraryScreen
            onBack={() => setScreen("preferences")}     // back → regenerate with new prefs
            onStartDay={() => setScreen("execution")}
          />
        )}

        {/* ── Screen 7 + 8: Execution ↔ Salvage ── */}
        {screen === "execution" && (
          <>
            <ExecutionScreen
              onBack={() => setScreen("itinerary")}
              onAdjust={() => setSalvageOpen(true)}
            />

            {/* Salvage Mode sheet slides up over Execution */}
            {salvageOpen && (
              <SalvageModeSheet
                onClose={() => setSalvageOpen(false)}
                onAccept={() => {
                  setSalvageOpen(false);
                  setScreen("itinerary");               // replanned itinerary replaces original
                }}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
