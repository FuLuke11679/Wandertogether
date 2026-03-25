import { useTripStore } from "../store";
import type { HydratedTripBundle } from "./remote-sync";

export function applyHydratedTripBundle(bundle: HydratedTripBundle): void {
  useTripStore.getState().upsertTrip(bundle.trip);
  useTripStore.setState({
    execution: bundle.execution,
    completedPairs: bundle.completedPairs,
    comparisonCount: bundle.comparisonCount,
  });
}
