import { Routes, Route, useLocation } from "react-router";
import { AnimatePresence } from "motion/react";
import { HomePage } from "../pages/HomePage";
import { ImportPage } from "../pages/ImportPage";
import { VotePage } from "../pages/VotePage";
import { ResultsPage } from "../pages/ResultsPage";
import { PreferencesPage } from "../pages/PreferencesPage";
import { BuildingPage } from "../pages/BuildingPage";
import { PlanPage } from "../pages/PlanPage";
import { LivePage } from "../pages/LivePage";
import { ProfilePage } from "../pages/ProfilePage";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#EDEAE4]">
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/trip/:id/import" element={<ImportPage />} />
            <Route path="/trip/:id/vote" element={<VotePage />} />
            <Route path="/trip/:id/results" element={<ResultsPage />} />
            <Route path="/trip/:id/preferences" element={<PreferencesPage />} />
            <Route path="/trip/:id/building" element={<BuildingPage />} />
            <Route path="/trip/:id/plan" element={<PlanPage />} />
            <Route path="/trip/:id/live" element={<LivePage />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}
