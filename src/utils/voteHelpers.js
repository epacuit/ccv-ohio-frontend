// utils/voteHelpers.js

/**
 * Formats ballot data for API submission
 * USES candidate_id consistently (NOT option_id)
 */
export const formatBallotData = (tableSelections = {}, pollId) => {
  const rankings = Object.entries(tableSelections).map(([candidateId, rank]) => ({
    candidate_id: candidateId,  // Use candidate_id consistently
    rank: rank
  }));

  return {
    poll_id: pollId,
    rankings: rankings
  };
};

/**
 * Shuffles candidates using Fisher-Yates algorithm
 */
export const shuffleCandidates = (candidates) => {
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Gets display order of candidates based on settings
 */
export const getDisplayCandidates = (candidates, settings) => {
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return [];
  return settings?.randomize_options ? shuffleCandidates(candidates) : [...candidates];
};

/**
 * Determines if poll details section should be shown
 */
export const shouldShowPollDetails = (poll) => {
  if (!poll) return false;
  if (poll?.description) return true;
  if (poll?.options?.some(opt => opt?.description || opt?.image_url)) return true;
  return false;
};