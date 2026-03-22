export type ActivityCategory =
  | "food"
  | "culture"
  | "shopping"
  | "nature"
  | "nightlife"
  | "adventure";

export type Activity = {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    neighborhood: string;
    /** Google Place ID for accurate Maps deep links when present */
    googlePlaceId?: string;
    /** From Geocoding — best string to show in Maps destination/search */
    formattedAddress?: string;
  };
  category: ActivityCategory;
  estimatedDuration: number; // minutes
  source?: string;
  photoUrl?: string;
  emoji?: string;
};

export type EloEntry = {
  activityId: string;
  eloScore: number;
};

export type UserRanking = {
  userId: string;
  userName: string;
  rankings: EloEntry[];
};

export type GroupPriority = {
  activityId: string;
  compositeScore: number;
  individualRanks: { userId: string; rank: number }[];
};

export type TransitMode = "walk" | "transit" | "taxi";

export type StopStatus = "upcoming" | "active" | "completed" | "skipped";

export type ItineraryStop = {
  activity: Activity;
  startTime: string;
  endTime: string;
  travelToNext: {
    duration: number; // minutes
    mode: TransitMode;
  };
  priority: number;
  status: StopStatus;
};

export type Pace = "relaxed" | "moderate" | "packed";
export type WalkingTolerance = "minimal" | "moderate" | "explorer";
export type Budget = "low" | "medium" | "high";

export type TripPreferences = {
  pace: Pace;
  walkingTolerance: WalkingTolerance;
  priorities: ActivityCategory[];
  startTime: string;
  endTime: string;
  budget: Budget;
};

export type TripMember = {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
};

export type TripStatus = "draft" | "voting" | "planning" | "active" | "completed";

export type ItineraryDay = {
  date: string;
  stops: ItineraryStop[];
};

/** Local profile for greeting + future invite features */
export type UserProfile = {
  displayName: string;
  email: string;
};

export type Trip = {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  coverImage?: string;
  status: TripStatus;
  activities: Activity[];
  members: TripMember[];
  rankings: UserRanking[];
  groupPriorities: GroupPriority[];
  preferences: TripPreferences;
  itinerary: ItineraryDay[];
};

export type SalvageReason = "late" | "weather" | "tired" | "other";

export type SalvageResult = {
  stops: ItineraryStop[];
  message: string;
};

export type ComparisonPair = {
  a: Activity;
  b: Activity;
};

export type ExecutionState = {
  activeDayIndex: number;
  activeStopIndex: number;
  completedIds: string[];
  skippedIds: string[];
  startedAt: string | null;
};
