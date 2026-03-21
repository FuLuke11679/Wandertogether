import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ExecutionScreen } from "../app/components/ExecutionScreen";
import { SalvageModeSheet } from "../app/components/SalvageModeSheet";
import { useTripStore } from "../lib/store";

export function LivePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentTripId = useTripStore((s) => s.currentTripId);
  const tripId = id ?? currentTripId ?? "";
  const [salvageOpen, setSalvageOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    const { execution } = useTripStore.getState();
    if (!execution.startedAt) {
      useTripStore.getState().startExecution(tripId);
    }
  }, [tripId]);

  if (!tripId) {
    navigate("/");
    return null;
  }

  return (
    <>
      <ExecutionScreen
        tripId={tripId}
        onBack={() => navigate(`/trip/${tripId}/plan`)}
        onSalvage={() => setSalvageOpen(true)}
      />

      {salvageOpen && (
        <SalvageModeSheet
          tripId={tripId}
          onClose={() => setSalvageOpen(false)}
          onAccept={() => {
            setSalvageOpen(false);
            navigate(`/trip/${tripId}/plan`);
          }}
        />
      )}
    </>
  );
}
