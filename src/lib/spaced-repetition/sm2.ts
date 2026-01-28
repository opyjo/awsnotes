import { addDays } from "date-fns";

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * SM-2 Algorithm for spaced repetition
 * Quality: 0-5 (0-2 = fail, 3-5 = pass)
 */
export const calculateSM2 = (
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result => {
  let newEF =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Failed - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Passed
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReviewDate: addDays(new Date(), newInterval),
  };
};

export const getQualityFromRating = (rating: "again" | "hard" | "good" | "easy"): number => {
  const qualityMap = {
    again: 0,
    hard: 1,
    good: 3,
    easy: 5,
  };
  return qualityMap[rating];
};
