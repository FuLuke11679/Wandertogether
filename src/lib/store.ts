import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Trip,
  Activity,
  TripPreferences,
  ItineraryStop,
  UserRanking,
  GroupPriority,
  ExecutionState,
  SalvageReason,
  ComparisonPair,
} from "./types";
import {
  initializeRankings,
  recordVote as applyVote,
  getNextPair,
  recommendedComparisons,
  mergeGroupRankings,
} from "./ranking";
import {
  SEED_TRIP,
  FALLBACK_ITINERARY,
  FALLBACK_SALVAGE,
  DEFAULT_PREFERENCES,
} from "./seed-data";

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface TripStore {
  // Data
  trips: Trip[];
  currentTripId: string | null;

  // Voting state (per-session, not persisted with the trip)
  completedPairs: string[]; // serialized as "id1:id2" sorted
  comparisonCount: number;

  // Execution state
  execution: ExecutionState;

  // ---------- Trip CRUD ----------
  setCurrentTrip: (tripId: string) => void;
  createTrip: (destination: string, dates: { start: string; end: string }) => string;
  addActivities: (tripId: string, activities: Activity[]) => void;

  // ---------- Voting ----------
  startVoting: (tripId: string, userId: string, userName: string) => void;
  recordVote: (tripId: string, userId: string, winnerId: string, loserId: string) => void;
  getCurrentPair: (tripId: string, userId: string) => ComparisonPair | null;
  getRecommendedTotal: (tripId: string) => number;
  isVotingComplete: (tripId: string) => boolean;

  // ---------- Rankings ----------
  generateGroupPriorities: (tripId: string) => void;

  // ---------- Preferences ----------
  setPreferences: (tripId: string, prefs: Partial<TripPreferences>) => void;

  // ---------- Itinerary ----------
  setItinerary: (tripId: string, stops: ItineraryStop[]) => void;
  loadFallbackItinerary: (tripId: string) => void;

  // ---------- Execution ----------
  startExecution: (tripId: string) => void;
  advanceStop: (tripId: string) => void;
  skipStop: (tripId: string) => void;
  shouldTriggerSalvage: (tripId: string) => boolean;
  getActiveStop: (tripId: string) => ItineraryStop | undefined;

  // ---------- Salvage ----------
  applySalvage: (tripId: string, newStops: ItineraryStop[]) => void;
  applyFallbackSalvage: (tripId: string) => string;

  // ---------- Helpers ----------
  getTrip: (tripId: string) => Trip | undefined;
  getCurrentTrip: () => Trip | undefined;
}

// ---------------------------------------------------------------------------
// Helper: update a trip inside the trips array
// ---------------------------------------------------------------------------

function updateTrip(
  trips: Trip[],
  tripId: string,
  updater: (trip: Trip) => Partial<Trip>,
): Trip[] {
  return trips.map((t) =>
    t.id === tripId ? { ...t, ...updater(t) } : t,
  );
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [SEED_TRIP],
      currentTripId: SEED_TRIP.id,

      completedPairs: [],
      comparisonCount: 0,

      execution: {
        activeStopIndex: 0,
        completedIds: [],
        skippedIds: [],
        startedAt: null,
      },

      // ── Helpers ──────────────────────────────────────────────

      getTrip: (tripId) => get().trips.find((t) => t.id === tripId),

      getCurrentTrip: () => {
        const { trips, currentTripId } = get();
        return trips.find((t) => t.id === currentTripId);
      },

      // ── Trip CRUD ────────────────────────────────────────────

      setCurrentTrip: (tripId) => set({ currentTripId: tripId }),

      createTrip: (destination, dates) => {
        const id = `trip-${Date.now()}`;
        const trip: Trip = {
          id,
          destination,
          dates,
          status: "draft",
          activities: [],
          members: [{ id: "sarah", name: "Sarah", initials: "S" }],
          rankings: [],
          groupPriorities: [],
          preferences: { ...DEFAULT_PREFERENCES },
          itinerary: [],
        };
        set((s) => ({ trips: [...s.trips, trip], currentTripId: id }));
        return id;
      },

      addActivities: (tripId, activities) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            activities: [
              ...t.activities,
              ...activities.filter(
                (a) => !t.activities.some((e) => e.id === a.id),
              ),
            ],
          })),
        })),

      // ── Voting ───────────────────────────────────────────────

      startVoting: (tripId, userId, userName) => {
        const trip = get().getTrip(tripId);
        if (!trip) return;

        const existing = trip.rankings.find((r) => r.userId === userId);
        if (existing) return;

        const ranking = initializeRankings(userId, userName, trip.activities);
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            rankings: [...t.rankings, ranking],
            status: "voting",
          })),
          completedPairs: [],
          comparisonCount: 0,
        }));
      },

      recordVote: (tripId, userId, winnerId, loserId) => {
        const trip = get().getTrip(tripId);
        if (!trip) return;

        const pairKey = [winnerId, loserId].sort().join(":");

        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            rankings: t.rankings.map((ur) => {
              if (ur.userId !== userId) return ur;
              return {
                ...ur,
                rankings: applyVote(ur.rankings, winnerId, loserId),
              };
            }),
          })),
          completedPairs: [...s.completedPairs, pairKey],
          comparisonCount: s.comparisonCount + 1,
        }));
      },

      getCurrentPair: (tripId, userId) => {
        const trip = get().getTrip(tripId);
        if (!trip) return null;

        const userRanking = trip.rankings.find((r) => r.userId === userId);
        if (!userRanking) return null;

        const completedSet = new Set(get().completedPairs);
        return getNextPair(userRanking.rankings, trip.activities, completedSet);
      },

      getRecommendedTotal: (tripId) => {
        const trip = get().getTrip(tripId);
        if (!trip) return 12;
        return recommendedComparisons(trip.activities.length);
      },

      isVotingComplete: (tripId) => {
        const trip = get().getTrip(tripId);
        if (!trip) return false;
        const total = recommendedComparisons(trip.activities.length);
        return get().comparisonCount >= total;
      },

      // ── Rankings ─────────────────────────────────────────────

      generateGroupPriorities: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            groupPriorities: mergeGroupRankings(t.rankings),
          })),
        })),

      // ── Preferences ──────────────────────────────────────────

      setPreferences: (tripId, prefs) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            preferences: { ...t.preferences, ...prefs },
          })),
        })),

      // ── Itinerary ────────────────────────────────────────────

      setItinerary: (tripId, stops) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            itinerary: stops,
            status: "active",
          })),
        })),

      loadFallbackItinerary: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: FALLBACK_ITINERARY.map((s) => ({ ...s, status: "upcoming" as const })),
            status: "active",
          })),
        })),

      // ── Execution ────────────────────────────────────────────

      startExecution: (tripId) => {
        const trip = get().getTrip(tripId);
        if (!trip || trip.itinerary.length === 0) return;

        const updatedStops = trip.itinerary.map((stop, i) => ({
          ...stop,
          status: i === 0 ? ("active" as const) : ("upcoming" as const),
        }));

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedStops,
          })),
          execution: {
            activeStopIndex: 0,
            completedIds: [],
            skippedIds: [],
            startedAt: new Date().toISOString(),
          },
        }));
      },

      advanceStop: (tripId) => {
        const trip = get().getTrip(tripId);
        const { execution } = get();
        if (!trip) return;

        const currentStop = trip.itinerary[execution.activeStopIndex];
        if (!currentStop) return;

        const nextIndex = execution.activeStopIndex + 1;
        const updatedStops = trip.itinerary.map((stop, i) => {
          if (i === execution.activeStopIndex)
            return { ...stop, status: "completed" as const };
          if (i === nextIndex)
            return { ...stop, status: "active" as const };
          return stop;
        });

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedStops,
          })),
          execution: {
            ...s.execution,
            activeStopIndex: nextIndex,
            completedIds: [...s.execution.completedIds, currentStop.activity.id],
          },
        }));
      },

      skipStop: (tripId) => {
        const trip = get().getTrip(tripId);
        const { execution } = get();
        if (!trip) return;

        const currentStop = trip.itinerary[execution.activeStopIndex];
        if (!currentStop) return;

        const nextIndex = execution.activeStopIndex + 1;
        const updatedStops = trip.itinerary.map((stop, i) => {
          if (i === execution.activeStopIndex)
            return { ...stop, status: "skipped" as const };
          if (i === nextIndex)
            return { ...stop, status: "active" as const };
          return stop;
        });

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedStops,
          })),
          execution: {
            ...s.execution,
            activeStopIndex: nextIndex,
            skippedIds: [...s.execution.skippedIds, currentStop.activity.id],
          },
        }));
      },

      shouldTriggerSalvage: (tripId) => {
        const { execution } = get();
        if (execution.skippedIds.length >= 2) return true;

        const trip = get().getTrip(tripId);
        if (!trip || !execution.startedAt) return false;

        const activeStop = trip.itinerary[execution.activeStopIndex];
        if (!activeStop) return false;

        // Parse end time (HH:MM format) and check if we're 30+ min behind
        const [hours, minutes] = activeStop.endTime.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;

        const now = new Date();
        const endToday = new Date();
        endToday.setHours(hours, minutes, 0, 0);

        const behindMs = now.getTime() - endToday.getTime();
        return behindMs > 30 * 60 * 1000;
      },

      getActiveStop: (tripId) => {
        const trip = get().getTrip(tripId);
        if (!trip) return undefined;
        return trip.itinerary[get().execution.activeStopIndex];
      },

      // ── Salvage ──────────────────────────────────────────────

      applySalvage: (tripId, newStops) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: newStops,
          })),
          execution: {
            ...s.execution,
            activeStopIndex: 0,
            completedIds: [],
            skippedIds: [],
          },
        })),

      applyFallbackSalvage: (tripId) => {
        get().applySalvage(tripId, FALLBACK_SALVAGE.stops);
        return FALLBACK_SALVAGE.message;
      },
    }),
    {
      name: "wandersync-store",
      partialize: (state) => ({
        trips: state.trips,
        currentTripId: state.currentTripId,
        execution: state.execution,
      }),
    },
  ),
);
