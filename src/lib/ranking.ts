import type { Activity, EloEntry, UserRanking, GroupPriority, ComparisonPair } from "./types";

const K_FACTOR = 32;
const INITIAL_ELO = 1000;

// ---------------------------------------------------------------------------
// Elo calculation
// ---------------------------------------------------------------------------

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Returns [newWinnerElo, newLoserElo] after a single match.
 */
export function computeElo(
  winnerElo: number,
  loserElo: number,
): [number, number] {
  const eWin = expectedScore(winnerElo, loserElo);
  const eLose = expectedScore(loserElo, winnerElo);

  const newWinner = Math.round(winnerElo + K_FACTOR * (1 - eWin));
  const newLoser = Math.round(loserElo + K_FACTOR * (0 - eLose));

  return [newWinner, newLoser];
}

// ---------------------------------------------------------------------------
// Initialize rankings for a set of activities
// ---------------------------------------------------------------------------

export function initializeRankings(
  userId: string,
  userName: string,
  activities: Activity[],
): UserRanking {
  return {
    userId,
    userName,
    rankings: activities.map((a) => ({
      activityId: a.id,
      eloScore: INITIAL_ELO,
    })),
  };
}

// ---------------------------------------------------------------------------
// Record a vote: mutates rankings in place, returns updated array
// ---------------------------------------------------------------------------

export function recordVote(
  rankings: EloEntry[],
  winnerId: string,
  loserId: string,
): EloEntry[] {
  const winner = rankings.find((r) => r.activityId === winnerId);
  const loser = rankings.find((r) => r.activityId === loserId);
  if (!winner || !loser) return rankings;

  const [newW, newL] = computeElo(winner.eloScore, loser.eloScore);
  winner.eloScore = newW;
  loser.eloScore = newL;

  return [...rankings];
}

// ---------------------------------------------------------------------------
// Swiss-system pairing
//
// Sorts activities by current Elo, then pairs adjacent entries.
// This creates more informative comparisons than random pairing
// because similarly-ranked items are compared against each other.
// ---------------------------------------------------------------------------

export function generateSwissPairs(
  rankings: EloEntry[],
  activities: Activity[],
  completedPairs: Set<string>,
): ComparisonPair[] {
  const sorted = [...rankings].sort((a, b) => b.eloScore - a.eloScore);
  const actMap = new Map(activities.map((a) => [a.id, a]));
  const pairs: ComparisonPair[] = [];

  for (let i = 0; i < sorted.length - 1; i += 2) {
    const aId = sorted[i].activityId;
    const bId = sorted[i + 1].activityId;
    const pairKey = [aId, bId].sort().join(":");

    if (!completedPairs.has(pairKey)) {
      const a = actMap.get(aId);
      const b = actMap.get(bId);
      if (a && b) pairs.push({ a, b });
    }
  }

  // If all adjacent pairs are exhausted, try offset-by-one pairing
  if (pairs.length === 0) {
    for (let i = 0; i < sorted.length - 2; i++) {
      const aId = sorted[i].activityId;
      const bId = sorted[i + 2].activityId;
      const pairKey = [aId, bId].sort().join(":");

      if (!completedPairs.has(pairKey)) {
        const a = actMap.get(aId);
        const b = actMap.get(bId);
        if (a && b) {
          pairs.push({ a, b });
          break;
        }
      }
    }
  }

  return pairs;
}

/**
 * Returns the next pair to present, or null if voting is complete.
 */
export function getNextPair(
  rankings: EloEntry[],
  activities: Activity[],
  completedPairs: Set<string>,
): ComparisonPair | null {
  const pairs = generateSwissPairs(rankings, activities, completedPairs);
  return pairs[0] ?? null;
}

/**
 * Recommended number of comparisons for a set of activities.
 * Roughly N * 0.8, clamped to [5, 20].
 */
export function recommendedComparisons(activityCount: number): number {
  return Math.min(20, Math.max(5, Math.round(activityCount * 0.8)));
}

// ---------------------------------------------------------------------------
// Normalize Elo scores to 0–100 range
// ---------------------------------------------------------------------------

export function normalizeRankings(rankings: EloEntry[]): EloEntry[] {
  if (rankings.length === 0) return [];

  const scores = rankings.map((r) => r.eloScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  return rankings.map((r) => ({
    activityId: r.activityId,
    eloScore: Math.round(((r.eloScore - min) / range) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Merge multiple users' rankings into group priorities
// ---------------------------------------------------------------------------

export function mergeGroupRankings(
  userRankings: UserRanking[],
): GroupPriority[] {
  if (userRankings.length === 0) return [];

  const normalized = userRankings.map((ur) => ({
    ...ur,
    rankings: normalizeRankings(ur.rankings),
  }));

  // Collect all activity IDs
  const activityIds = new Set<string>();
  for (const ur of normalized) {
    for (const r of ur.rankings) {
      activityIds.add(r.activityId);
    }
  }

  const priorities: GroupPriority[] = [];

  for (const actId of activityIds) {
    const scores: number[] = [];
    const individualRanks: { userId: string; rank: number }[] = [];

    for (const ur of normalized) {
      const sorted = [...ur.rankings].sort((a, b) => b.eloScore - a.eloScore);
      const rankIndex = sorted.findIndex((r) => r.activityId === actId);
      const entry = ur.rankings.find((r) => r.activityId === actId);

      if (entry) {
        scores.push(entry.eloScore);
        individualRanks.push({
          userId: ur.userId,
          rank: rankIndex + 1,
        });
      }
    }

    const compositeScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

    priorities.push({ activityId: actId, compositeScore, individualRanks });
  }

  return priorities.sort((a, b) => b.compositeScore - a.compositeScore);
}
