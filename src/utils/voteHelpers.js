// utils/voteHelpers.js

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