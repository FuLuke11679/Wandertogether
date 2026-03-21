import type {
  Activity,
  Trip,
  TripMember,
  UserRanking,
  GroupPriority,
  ItineraryStop,
  TripPreferences,
  SalvageResult,
} from "./types";

// ---------------------------------------------------------------------------
// 15 Tokyo activities with real coordinates
// ---------------------------------------------------------------------------

export const SEED_ACTIVITIES: Activity[] = [
  {
    id: "sensoji",
    name: "Senso-ji Temple",
    description: "Tokyo's oldest Buddhist temple with the iconic Thunder Gate and Nakamise-dori approach",
    location: { lat: 35.7148, lng: 139.7967, neighborhood: "Asakusa" },
    category: "culture",
    estimatedDuration: 75,
    emoji: "⛩️",
    photoUrl: "https://images.unsplash.com/photo-1771385706304-19ab1fb5fd61?w=800",
  },
  {
    id: "meiji",
    name: "Meiji Shrine",
    description: "Peaceful forested sanctuary dedicated to Emperor Meiji in the heart of Harajuku",
    location: { lat: 35.6764, lng: 139.6993, neighborhood: "Harajuku" },
    category: "culture",
    estimatedDuration: 60,
    emoji: "⛩️",
    photoUrl: "https://images.unsplash.com/photo-1707836907233-07f01776ac18?w=800",
  },
  {
    id: "teamlab",
    name: "teamLab Borderless",
    description: "Immersive digital art museum where installations flow between rooms",
    location: { lat: 35.6577, lng: 139.782, neighborhood: "Azabudai" },
    category: "culture",
    estimatedDuration: 120,
    emoji: "🎨",
    photoUrl: "https://images.unsplash.com/photo-1768141728185-c14bdfe90f91?w=800",
  },
  {
    id: "tsukiji",
    name: "Tsukiji Outer Market",
    description: "Fresh sushi, tamagoyaki, and street bites from dozens of local vendors",
    location: { lat: 35.6654, lng: 139.7707, neighborhood: "Tsukiji" },
    category: "food",
    estimatedDuration: 90,
    emoji: "🍣",
    photoUrl: "https://images.unsplash.com/photo-1590582917892-a6e11d1b32bc?w=800",
  },
  {
    id: "ichiran",
    name: "Ichiran Ramen Shibuya",
    description: "Solo-booth tonkotsu ramen — rich, private, and deeply local",
    location: { lat: 35.6591, lng: 139.7006, neighborhood: "Shibuya" },
    category: "food",
    estimatedDuration: 45,
    emoji: "🍜",
    photoUrl: "https://images.unsplash.com/photo-1598977700511-fe0707d5eae6?w=800",
  },
  {
    id: "afuri",
    name: "Afuri Ramen",
    description: "Signature yuzu shio ramen with a light, citrusy broth",
    location: { lat: 35.6468, lng: 139.7104, neighborhood: "Ebisu" },
    category: "food",
    estimatedDuration: 45,
    emoji: "🍜",
    photoUrl: "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=800",
  },
  {
    id: "shibuya-crossing",
    name: "Shibuya Crossing",
    description: "The world's busiest pedestrian intersection — pure spectacle at dusk",
    location: { lat: 35.6595, lng: 139.7004, neighborhood: "Shibuya" },
    category: "adventure",
    estimatedDuration: 30,
    emoji: "🌆",
    photoUrl: "https://images.unsplash.com/photo-1609942225969-3f3109a13eb8?w=800",
  },
  {
    id: "takeshita",
    name: "Harajuku Takeshita Street",
    description: "Colorful teen-fashion street with crêpes, vintage stores, and kawaii culture",
    location: { lat: 35.6716, lng: 139.7031, neighborhood: "Harajuku" },
    category: "shopping",
    estimatedDuration: 60,
    emoji: "🛍️",
    photoUrl: "https://images.unsplash.com/photo-1542931287-023b922fa89b?w=800",
  },
  {
    id: "shinjuku-gyoen",
    name: "Shinjuku Gyoen",
    description: "Vast national garden blending French, English, and Japanese landscaping",
    location: { lat: 35.6852, lng: 139.71, neighborhood: "Shinjuku" },
    category: "nature",
    estimatedDuration: 90,
    emoji: "🌸",
    photoUrl: "https://images.unsplash.com/photo-1743834722201-92ce713c4342?w=800",
  },
  {
    id: "golden-gai",
    name: "Golden Gai",
    description: "Six narrow alleys packed with tiny 6-seat bars, each with its own vibe",
    location: { lat: 35.6938, lng: 139.7038, neighborhood: "Shinjuku" },
    category: "nightlife",
    estimatedDuration: 60,
    emoji: "🍸",
    photoUrl: "https://images.unsplash.com/photo-1758402277819-2517d9ab960b?w=800",
  },
  {
    id: "akihabara",
    name: "Akihabara Electric Town",
    description: "Neon-lit district for anime, manga, electronics, and retro gaming",
    location: { lat: 35.7023, lng: 139.7745, neighborhood: "Akihabara" },
    category: "shopping",
    estimatedDuration: 75,
    emoji: "🎮",
    photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
  },
  {
    id: "ueno-park",
    name: "Ueno Park",
    description: "Sprawling park with museums, a zoo, temples, and seasonal cherry blossoms",
    location: { lat: 35.7146, lng: 139.7714, neighborhood: "Ueno" },
    category: "nature",
    estimatedDuration: 60,
    emoji: "🌿",
    photoUrl: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800",
  },
  {
    id: "nakamise",
    name: "Nakamise Shopping Street",
    description: "Traditional souvenir street leading to Senso-ji with snacks and crafts",
    location: { lat: 35.7118, lng: 139.7963, neighborhood: "Asakusa" },
    category: "shopping",
    estimatedDuration: 45,
    emoji: "🏮",
    photoUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
  },
  {
    id: "robot-restaurant",
    name: "Robot Restaurant",
    description: "Over-the-top neon spectacle with robots, dancers, and laser shows",
    location: { lat: 35.6942, lng: 139.7013, neighborhood: "Shinjuku" },
    category: "nightlife",
    estimatedDuration: 90,
    emoji: "🤖",
    photoUrl: "https://images.unsplash.com/photo-1554797589-7241bb691548?w=800",
  },
  {
    id: "skytree",
    name: "Tokyo Skytree",
    description: "634m broadcasting tower with panoramic observation decks over the city",
    location: { lat: 35.7101, lng: 139.8107, neighborhood: "Sumida" },
    category: "culture",
    estimatedDuration: 60,
    emoji: "🗼",
    photoUrl: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800",
  },
];

// ---------------------------------------------------------------------------
// Trip members (demo roster)
// ---------------------------------------------------------------------------

export const SEED_MEMBERS: TripMember[] = [
  { id: "sarah", name: "Sarah", initials: "S" },
  { id: "marcus", name: "Marcus", initials: "M" },
  { id: "jess", name: "Jess", initials: "J" },
  { id: "alex", name: "Alex", initials: "A" },
];

// ---------------------------------------------------------------------------
// 3 simulated user rankings (pre-computed Elo scores)
// Each user has a different preference profile.
// ---------------------------------------------------------------------------

// Sarah — balanced, slight food + culture lean
const sarahRankings: UserRanking = {
  userId: "sarah",
  userName: "Sarah",
  rankings: [
    { activityId: "tsukiji", eloScore: 1142 },
    { activityId: "teamlab", eloScore: 1128 },
    { activityId: "sensoji", eloScore: 1105 },
    { activityId: "meiji", eloScore: 1088 },
    { activityId: "ichiran", eloScore: 1074 },
    { activityId: "shinjuku-gyoen", eloScore: 1055 },
    { activityId: "golden-gai", eloScore: 1032 },
    { activityId: "shibuya-crossing", eloScore: 1018 },
    { activityId: "skytree", eloScore: 1004 },
    { activityId: "takeshita", eloScore: 988 },
    { activityId: "afuri", eloScore: 972 },
    { activityId: "ueno-park", eloScore: 955 },
    { activityId: "nakamise", eloScore: 938 },
    { activityId: "akihabara", eloScore: 920 },
    { activityId: "robot-restaurant", eloScore: 898 },
  ],
};

// Marcus — culture + nature focused
const marcusRankings: UserRanking = {
  userId: "marcus",
  userName: "Marcus",
  rankings: [
    { activityId: "sensoji", eloScore: 1155 },
    { activityId: "meiji", eloScore: 1138 },
    { activityId: "shinjuku-gyoen", eloScore: 1120 },
    { activityId: "teamlab", eloScore: 1102 },
    { activityId: "ueno-park", eloScore: 1085 },
    { activityId: "skytree", eloScore: 1068 },
    { activityId: "tsukiji", eloScore: 1040 },
    { activityId: "shibuya-crossing", eloScore: 1015 },
    { activityId: "nakamise", eloScore: 1000 },
    { activityId: "ichiran", eloScore: 980 },
    { activityId: "afuri", eloScore: 962 },
    { activityId: "takeshita", eloScore: 940 },
    { activityId: "golden-gai", eloScore: 920 },
    { activityId: "akihabara", eloScore: 900 },
    { activityId: "robot-restaurant", eloScore: 878 },
  ],
};

// Jess — nightlife + shopping + adventure focused
const jessRankings: UserRanking = {
  userId: "jess",
  userName: "Jess",
  rankings: [
    { activityId: "golden-gai", eloScore: 1150 },
    { activityId: "shibuya-crossing", eloScore: 1132 },
    { activityId: "takeshita", eloScore: 1115 },
    { activityId: "robot-restaurant", eloScore: 1098 },
    { activityId: "akihabara", eloScore: 1082 },
    { activityId: "teamlab", eloScore: 1060 },
    { activityId: "ichiran", eloScore: 1040 },
    { activityId: "tsukiji", eloScore: 1020 },
    { activityId: "nakamise", eloScore: 1005 },
    { activityId: "afuri", eloScore: 990 },
    { activityId: "sensoji", eloScore: 968 },
    { activityId: "skytree", eloScore: 950 },
    { activityId: "shinjuku-gyoen", eloScore: 930 },
    { activityId: "meiji", eloScore: 910 },
    { activityId: "ueno-park", eloScore: 888 },
  ],
};

export const SEED_RANKINGS: UserRanking[] = [
  sarahRankings,
  marcusRankings,
  jessRankings,
];

// ---------------------------------------------------------------------------
// Default preferences
// ---------------------------------------------------------------------------

export const DEFAULT_PREFERENCES: TripPreferences = {
  pace: "moderate",
  walkingTolerance: "moderate",
  priorities: ["food", "culture", "adventure"],
  startTime: "09:00",
  endTime: "22:00",
  budget: "medium",
};

// ---------------------------------------------------------------------------
// Fallback itinerary (Day 1 — used when LLM is unavailable)
// ---------------------------------------------------------------------------

function act(id: string): Activity {
  return SEED_ACTIVITIES.find((a) => a.id === id)!;
}

export const FALLBACK_ITINERARY: ItineraryStop[] = [
  {
    activity: act("tsukiji"),
    startTime: "09:00",
    endTime: "10:30",
    travelToNext: { duration: 12, mode: "transit" },
    priority: 1,
    status: "upcoming",
  },
  {
    activity: act("sensoji"),
    startTime: "10:45",
    endTime: "12:00",
    travelToNext: { duration: 8, mode: "walk" },
    priority: 2,
    status: "upcoming",
  },
  {
    activity: act("teamlab"),
    startTime: "12:30",
    endTime: "14:30",
    travelToNext: { duration: 18, mode: "transit" },
    priority: 3,
    status: "upcoming",
  },
  {
    activity: act("meiji"),
    startTime: "15:00",
    endTime: "16:00",
    travelToNext: { duration: 10, mode: "walk" },
    priority: 4,
    status: "upcoming",
  },
  {
    activity: act("shibuya-crossing"),
    startTime: "16:15",
    endTime: "16:45",
    travelToNext: { duration: 5, mode: "walk" },
    priority: 5,
    status: "upcoming",
  },
  {
    activity: act("ichiran"),
    startTime: "17:00",
    endTime: "17:45",
    travelToNext: { duration: 15, mode: "transit" },
    priority: 6,
    status: "upcoming",
  },
  {
    activity: act("golden-gai"),
    startTime: "19:00",
    endTime: "21:00",
    travelToNext: { duration: 0, mode: "walk" },
    priority: 7,
    status: "upcoming",
  },
];

// ---------------------------------------------------------------------------
// Fallback salvage response
// ---------------------------------------------------------------------------

export const FALLBACK_SALVAGE: SalvageResult = {
  message:
    "It started raining in Shibuya. I've swapped your 2 outdoor stops for indoor alternatives nearby and shifted times to keep you on track.",
  stops: [
    {
      activity: act("teamlab"),
      startTime: "13:00",
      endTime: "15:00",
      travelToNext: { duration: 15, mode: "transit" },
      priority: 1,
      status: "upcoming",
    },
    {
      activity: act("ichiran"),
      startTime: "15:20",
      endTime: "16:05",
      travelToNext: { duration: 12, mode: "transit" },
      priority: 2,
      status: "upcoming",
    },
    {
      activity: act("akihabara"),
      startTime: "16:20",
      endTime: "17:35",
      travelToNext: { duration: 18, mode: "transit" },
      priority: 3,
      status: "upcoming",
    },
    {
      activity: act("golden-gai"),
      startTime: "19:00",
      endTime: "21:00",
      travelToNext: { duration: 0, mode: "walk" },
      priority: 4,
      status: "upcoming",
    },
  ],
};

// ---------------------------------------------------------------------------
// Pre-computed group priorities (from the 3 seed rankings)
// ---------------------------------------------------------------------------

export const SEED_GROUP_PRIORITIES: GroupPriority[] = [
  { activityId: "teamlab", compositeScore: 88.2, individualRanks: [{ userId: "sarah", rank: 2 }, { userId: "marcus", rank: 4 }, { userId: "jess", rank: 6 }] },
  { activityId: "sensoji", compositeScore: 83.5, individualRanks: [{ userId: "sarah", rank: 3 }, { userId: "marcus", rank: 1 }, { userId: "jess", rank: 11 }] },
  { activityId: "tsukiji", compositeScore: 82.1, individualRanks: [{ userId: "sarah", rank: 1 }, { userId: "marcus", rank: 7 }, { userId: "jess", rank: 8 }] },
  { activityId: "shibuya-crossing", compositeScore: 76.8, individualRanks: [{ userId: "sarah", rank: 8 }, { userId: "marcus", rank: 8 }, { userId: "jess", rank: 2 }] },
  { activityId: "golden-gai", compositeScore: 75.4, individualRanks: [{ userId: "sarah", rank: 7 }, { userId: "marcus", rank: 13 }, { userId: "jess", rank: 1 }] },
  { activityId: "meiji", compositeScore: 74.9, individualRanks: [{ userId: "sarah", rank: 4 }, { userId: "marcus", rank: 2 }, { userId: "jess", rank: 14 }] },
  { activityId: "ichiran", compositeScore: 72.3, individualRanks: [{ userId: "sarah", rank: 5 }, { userId: "marcus", rank: 10 }, { userId: "jess", rank: 7 }] },
  { activityId: "shinjuku-gyoen", compositeScore: 70.8, individualRanks: [{ userId: "sarah", rank: 6 }, { userId: "marcus", rank: 3 }, { userId: "jess", rank: 13 }] },
  { activityId: "skytree", compositeScore: 68.2, individualRanks: [{ userId: "sarah", rank: 9 }, { userId: "marcus", rank: 6 }, { userId: "jess", rank: 12 }] },
  { activityId: "takeshita", compositeScore: 67.5, individualRanks: [{ userId: "sarah", rank: 10 }, { userId: "marcus", rank: 12 }, { userId: "jess", rank: 3 }] },
  { activityId: "akihabara", compositeScore: 64.1, individualRanks: [{ userId: "sarah", rank: 14 }, { userId: "marcus", rank: 14 }, { userId: "jess", rank: 5 }] },
  { activityId: "nakamise", compositeScore: 62.8, individualRanks: [{ userId: "sarah", rank: 13 }, { userId: "marcus", rank: 9 }, { userId: "jess", rank: 9 }] },
  { activityId: "robot-restaurant", compositeScore: 60.2, individualRanks: [{ userId: "sarah", rank: 15 }, { userId: "marcus", rank: 15 }, { userId: "jess", rank: 4 }] },
  { activityId: "afuri", compositeScore: 58.9, individualRanks: [{ userId: "sarah", rank: 11 }, { userId: "marcus", rank: 11 }, { userId: "jess", rank: 10 }] },
  { activityId: "ueno-park", compositeScore: 55.4, individualRanks: [{ userId: "sarah", rank: 12 }, { userId: "marcus", rank: 5 }, { userId: "jess", rank: 15 }] },
];

// ---------------------------------------------------------------------------
// Complete seed trip
// ---------------------------------------------------------------------------

export const SEED_TRIP: Trip = {
  id: "tokyo-2026",
  destination: "Tokyo",
  dates: { start: "2026-03-22", end: "2026-03-26" },
  coverImage:
    "https://images.unsplash.com/photo-1770953176837-dec4a34236ae?w=1080",
  status: "active",
  activities: SEED_ACTIVITIES,
  members: SEED_MEMBERS,
  rankings: SEED_RANKINGS,
  groupPriorities: SEED_GROUP_PRIORITIES,
  preferences: DEFAULT_PREFERENCES,
  itinerary: FALLBACK_ITINERARY,
};
