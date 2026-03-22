import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Trip,
  UserProfile,
  Activity,
  TripPreferences,
  ItineraryStop,
  ItineraryDay,
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
import { extractActivities } from "./llm/extract-activities";
import { generateItinerary } from "./llm/generate-itinerary";
import { adaptTrip } from "./llm/adapt-trip";

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface TripStore {
  // Data
  trips: Trip[];
  currentTripId: string | null;
  userProfile: UserProfile;

  // Voting state (per-session, not persisted with the trip)
  completedPairs: string[]; // serialized as "id1:id2" sorted
  comparisonCount: number;

  // Execution state
  execution: ExecutionState;

  // ---------- Profile ----------
  setUserProfile: (updates: Partial<UserProfile>) => void;

  // ---------- Trip CRUD ----------
  setCurrentTrip: (tripId: string) => void;
  createTrip: (destination: string, dates: { start: string; end: string }) => string;
  deleteTrip: (tripId: string) => void;
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
  setItinerary: (tripId: string, days: ItineraryDay[]) => void;
  loadFallbackItinerary: (tripId: string) => void;
  getDayStops: (tripId: string, dayIndex: number) => ItineraryStop[];
  getTripDayCount: (tripId: string) => number;

  // ---------- Execution ----------
  startExecution: (tripId: string, dayIndex?: number) => void;
  advanceStop: (tripId: string) => void;
  skipStop: (tripId: string) => void;
  shouldTriggerSalvage: (tripId: string) => boolean;
  getActiveStop: (tripId: string) => ItineraryStop | undefined;

  // ---------- Salvage ----------
  applySalvage: (tripId: string, newStops: ItineraryStop[]) => void;
  applyFallbackSalvage: (tripId: string) => string;

  // ---------- LLM-powered async actions ----------
  extractAndAddActivities: (
    tripId: string,
    content: string,
    sourceUrl?: string,
  ) => Promise<{ activities: Activity[]; fromLLM: boolean }>;
  generateLLMItinerary: (tripId: string) => Promise<{
    days: ItineraryDay[];
    reasoning?: string;
    fromLLM: boolean;
  }>;
  adaptTripLLM: (
    tripId: string,
    reason?: SalvageReason,
    detail?: string,
  ) => Promise<{ message: string; stops: ItineraryStop[]; fromLLM: boolean }>;

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

      userProfile: { displayName: "Sarah", email: "" },

      completedPairs: [],
      comparisonCount: 0,

      execution: {
        activeDayIndex: 0,
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

      setUserProfile: (updates) =>
        set((s) => ({
          userProfile: { ...s.userProfile, ...updates },
        })),

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

      deleteTrip: (tripId) =>
        set((s) => {
          const remaining = s.trips.filter((t) => t.id !== tripId);
          const newCurrentId =
            s.currentTripId === tripId
              ? remaining[0]?.id ?? null
              : s.currentTripId;
          return { trips: remaining, currentTripId: newCurrentId };
        }),

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

      setItinerary: (tripId, days) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: days,
            status: "active",
          })),
        })),

      loadFallbackItinerary: (tripId) =>
        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: FALLBACK_ITINERARY.map((day) => ({
              ...day,
              stops: day.stops.map((stop) => ({ ...stop, status: "upcoming" as const })),
            })),
            status: "active",
          })),
        })),

      getDayStops: (tripId, dayIndex) => {
        const trip = get().getTrip(tripId);
        if (!trip || dayIndex < 0 || dayIndex >= trip.itinerary.length) return [];
        return trip.itinerary[dayIndex].stops;
      },

      getTripDayCount: (tripId) => {
        const trip = get().getTrip(tripId);
        return trip?.itinerary.length ?? 0;
      },

      // ── Execution ────────────────────────────────────────────

      startExecution: (tripId, dayIndex) => {
        const trip = get().getTrip(tripId);
        if (!trip || trip.itinerary.length === 0) return;

        const di = dayIndex ?? get().execution.activeDayIndex;
        const day = trip.itinerary[di];
        if (!day || day.stops.length === 0) return;

        const updatedItinerary = trip.itinerary.map((d, dIdx) => {
          if (dIdx !== di) return d;
          return {
            ...d,
            stops: d.stops.map((stop, i) => ({
              ...stop,
              status: i === 0 ? ("active" as const) : ("upcoming" as const),
            })),
          };
        });

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedItinerary,
          })),
          execution: {
            activeDayIndex: di,
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

        const day = trip.itinerary[execution.activeDayIndex];
        if (!day) return;
        const currentStop = day.stops[execution.activeStopIndex];
        if (!currentStop) return;

        const nextIndex = execution.activeStopIndex + 1;
        const updatedItinerary = trip.itinerary.map((d, dIdx) => {
          if (dIdx !== execution.activeDayIndex) return d;
          return {
            ...d,
            stops: d.stops.map((stop, i) => {
              if (i === execution.activeStopIndex) return { ...stop, status: "completed" as const };
              if (i === nextIndex) return { ...stop, status: "active" as const };
              return stop;
            }),
          };
        });

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedItinerary,
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

        const day = trip.itinerary[execution.activeDayIndex];
        if (!day) return;
        const currentStop = day.stops[execution.activeStopIndex];
        if (!currentStop) return;

        const nextIndex = execution.activeStopIndex + 1;
        const updatedItinerary = trip.itinerary.map((d, dIdx) => {
          if (dIdx !== execution.activeDayIndex) return d;
          return {
            ...d,
            stops: d.stops.map((stop, i) => {
              if (i === execution.activeStopIndex) return { ...stop, status: "skipped" as const };
              if (i === nextIndex) return { ...stop, status: "active" as const };
              return stop;
            }),
          };
        });

        set((s) => ({
          trips: updateTrip(s.trips, tripId, () => ({
            itinerary: updatedItinerary,
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

        const day = trip.itinerary[execution.activeDayIndex];
        if (!day) return false;
        const activeStop = day.stops[execution.activeStopIndex];
        if (!activeStop) return false;

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
        const { execution } = get();
        const day = trip.itinerary[execution.activeDayIndex];
        if (!day) return undefined;
        return day.stops[execution.activeStopIndex];
      },

      // ── Salvage ──────────────────────────────────────────────

      applySalvage: (tripId, newStops) => {
        const { execution } = get();
        set((s) => ({
          trips: updateTrip(s.trips, tripId, (t) => ({
            itinerary: t.itinerary.map((d, dIdx) =>
              dIdx === execution.activeDayIndex ? { ...d, stops: newStops } : d,
            ),
          })),
          execution: {
            ...s.execution,
            activeStopIndex: 0,
            completedIds: [],
            skippedIds: [],
          },
        }));
      },

      applyFallbackSalvage: (tripId) => {
        get().applySalvage(tripId, FALLBACK_SALVAGE.stops);
        return FALLBACK_SALVAGE.message;
      },

      // ── LLM-powered async actions ─────────────────────────────

      extractAndAddActivities: async (tripId, content, sourceUrl) => {
        const result = await extractActivities(content, sourceUrl);
        if (result.activities.length > 0) {
          get().addActivities(tripId, result.activities);
        }
        return result;
      },

      generateLLMItinerary: async (tripId) => {
        const trip = get().getTrip(tripId);
        if (!trip) throw new Error("Trip not found");

        const result = await generateItinerary(
          trip.activities,
          trip.groupPriorities,
          trip.preferences,
          trip.dates,
          trip.destination,
        );

        if (result.days.length > 0) {
          get().setItinerary(tripId, result.days);
        }

        return result;
      },

      adaptTripLLM: async (tripId, reason, detail) => {
        const trip = get().getTrip(tripId);
        if (!trip) throw new Error("Trip not found");

        const { execution } = get();
        const currentDay = trip.itinerary[execution.activeDayIndex];
        const dayStops = currentDay?.stops ?? [];
        const { result, fromLLM } = await adaptTrip(
          dayStops,
          execution.completedIds,
          execution.skippedIds,
          trip.activities,
          reason,
          trip.destination,
          detail,
        );

        return { message: result.message, stops: result.stops, fromLLM };
      },
    }),
    {
      name: "wandersync-store",
      partialize: (state) => ({
        trips: state.trips,
        currentTripId: state.currentTripId,
        execution: state.execution,
        userProfile: state.userProfile,
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<TripStore> | undefined;
        const c = currentState as TripStore;
        if (!p) return c;
        const merged: TripStore = {
          ...c,
          ...p,
          trips: p.trips ?? c.trips,
          currentTripId: p.currentTripId ?? c.currentTripId,
          execution: p.execution ?? c.execution,
          userProfile: {
            ...c.userProfile,
            ...(p.userProfile ?? {}),
          },
        };
        // Demo seed trip must always exist (persisted state can drop it or corrupt ids)
        if (!merged.trips.some((t) => t.id === SEED_TRIP.id)) {
          merged.trips = [SEED_TRIP, ...merged.trips];
        }
        if (merged.trips.length > 0) {
          const ok =
            merged.currentTripId &&
            merged.trips.some((t) => t.id === merged.currentTripId);
          if (!ok) {
            const seed = merged.trips.find((t) => t.id === SEED_TRIP.id);
            merged.currentTripId = seed?.id ?? merged.trips[0].id;
          }
        }
        return merged;
      },
    },
  ),
);
