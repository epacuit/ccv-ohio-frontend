// utils/ballotProcessingRules.js
// JavaScript implementation of ballot processing rules from Python

/**
 * Rule types for ballot processing
 */
export const BALLOT_PROCESSING_RULES = {
  ALASKA: 'alaska',
  TRUNCATION: 'truncation'
};

/**
 * Returns true if there is any skipped rank in the ballot
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @returns {boolean}
 */
export const hasSkippedRank = (ballot) => {
  const ranks = [...new Set(Object.values(ballot))].sort((a, b) => a - b);
  const expectedRanks = Array.from({length: ranks.length}, (_, i) => i + 1);
  return JSON.stringify(ranks) !== JSON.stringify(expectedRanks);
};

/**
 * Returns true if candidate is ranked and there is a skipped rank above the rank of candidate in ballot
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @param {string} candidateId - The candidate ID to check
 * @returns {boolean}
 */
export const hasSkippedRankAbove = (ballot, candidateId) => {
  const candidateRank = ballot[candidateId];
  if (candidateRank === undefined || candidateRank === null) {
    return false;
  }
  
  const allRanks = Object.values(ballot);
  for (let rank = 1; rank < candidateRank; rank++) {
    if (!allRanks.includes(rank)) {
      return true;
    }
  }
  return false;
};

/**
 * Truncates the ballot at the first occurrence of two skipped ranks in a row
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @returns {Object} Truncated ballot
 */
export const truncateBallot = (ballot) => {
  if (!ballot || Object.keys(ballot).length === 0) {
    return ballot;
  }
  
  const ranks = [...new Set(Object.values(ballot))].sort((a, b) => a - b);
  const truncatedRanks = [];
  
  for (let i = 0; i < ranks.length; i++) {
    const currentRank = ranks[i];
    const nextRank = i + 1 < ranks.length ? ranks[i + 1] : null;
    
    truncatedRanks.push(currentRank);
    
    if (nextRank !== null && (nextRank - currentRank - 1) >= 2) {
      break;
    }
  }
  
  const truncatedBallot = {};
  Object.entries(ballot).forEach(([candidateId, rank]) => {
    if (truncatedRanks.includes(rank)) {
      truncatedBallot[candidateId] = rank;
    }
  });
  
  return truncatedBallot;
};

/**
 * Infers the pairwise comparison between two candidates using Alaska rules
 * Matches the Python implementation exactly:
 * - If both candidates are ranked, then the one with the lower rank is the pairwise choice; otherwise, they are both the pairwise choice (tie).
 * - If only one candidate is ranked, then that candidate is the pairwise choice if there is not a skipped rank above that candidate; otherwise, the pairwise comparison is undetermined (None).
 * - If neither candidate is ranked, then the pairwise comparison is undetermined (None).
 * 
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @param {string} cand1 - First candidate ID
 * @param {string} cand2 - Second candidate ID
 * @returns {Object|null} Comparison result or null if undetermined
 */
export const inferPairwiseComparisonAlaskaRules = (ballot, cand1, cand2) => {
  const rankCand1 = ballot[cand1];
  const rankCand2 = ballot[cand2];
  const menu = [cand1, cand2];
  
  // Special case: if ballot is completely empty, all matchups are undefined
  const ballotIsEmpty = Object.keys(ballot).length === 0;
  if (ballotIsEmpty) {
    return null; // undefined for empty ballots
  }
  
  // Both candidates are ranked
  if (rankCand1 !== undefined && rankCand1 !== null && 
      rankCand2 !== undefined && rankCand2 !== null) {
    if (rankCand1 < rankCand2) {
      return { menu, choice: [cand1] }; // cand1 is chosen
    } else if (rankCand2 < rankCand1) {
      return { menu, choice: [cand2] }; // cand2 is chosen
    } else {
      return { menu, choice: [cand1, cand2] }; // tie
    }
  }
  
  // Check if exactly one candidate is ranked
  const cand1Ranked = rankCand1 !== undefined && rankCand1 !== null;
  const cand2Ranked = rankCand2 !== undefined && rankCand2 !== null;
  const exactlyOneRanked = (cand1Ranked && !cand2Ranked) || (!cand1Ranked && cand2Ranked);
  
  if (exactlyOneRanked) {
    const rankedCand = cand1Ranked ? cand1 : cand2;
    if (!hasSkippedRankAbove(ballot, rankedCand)) {
      return { menu, choice: [rankedCand] }; // ranked candidate is chosen
    } else {
      return null; // undetermined
    }
  }
  
  // Neither candidate is ranked
  if (!cand1Ranked && !cand2Ranked) {
    if (!hasSkippedRank(ballot)) {
      return { menu, choice: [cand1, cand2] }; // tie
    } else {
      return null; // undetermined
    }
  }
  
  return null;
};

/**
 * Infers the pairwise comparison between two candidates using truncation rules
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @param {string} cand1 - First candidate ID
 * @param {string} cand2 - Second candidate ID
 * @returns {Object} Comparison result
 */
export const inferPairwiseComparisonTruncationRules = (ballot, cand1, cand2) => {
  const truncatedBallot = truncateBallot(ballot);
  const rankCand1 = truncatedBallot[cand1];
  const rankCand2 = truncatedBallot[cand2];
  const menu = [cand1, cand2];
  
  // Both candidates are ranked
  if (rankCand1 !== undefined && rankCand2 !== undefined) {
    if (rankCand1 < rankCand2) {
      return { menu, choice: [cand1] }; // cand1 is chosen
    } else if (rankCand2 < rankCand1) {
      return { menu, choice: [cand2] }; // cand2 is chosen
    } else {
      return { menu, choice: menu }; // tie
    }
  }
  
  // Exactly one candidate is ranked
  const bothUnranked = rankCand1 === undefined && rankCand2 === undefined;
  const exactlyOneRanked = (rankCand1 === undefined || rankCand2 === undefined) && !bothUnranked;
  
  if (exactlyOneRanked) {
    const rankedCand = rankCand1 !== undefined ? cand1 : cand2;
    return { menu, choice: [rankedCand] }; // ranked candidate is chosen
  }
  
  // Neither candidate is ranked
  return { menu, choice: menu }; // tie
};

/**
 * Get the appropriate pairwise comparison function based on rule type
 * @param {string} ruleType - Either 'alaska' or 'truncation'
 * @returns {Function} The comparison function
 */
export const getPairwiseComparisonFunction = (ruleType = BALLOT_PROCESSING_RULES.ALASKA) => {
  switch (ruleType) {
    case BALLOT_PROCESSING_RULES.TRUNCATION:
      return inferPairwiseComparisonTruncationRules;
    case BALLOT_PROCESSING_RULES.ALASKA:
    default:
      return inferPairwiseComparisonAlaskaRules;
  }
};

/**
 * Convert ballot to pairwise comparisons using specified rules
 * @param {Object} ballot - Object with candidateId as key, rank as value
 * @param {Array} candidates - Array of candidate objects
 * @param {string} ruleType - Processing rule type
 * @returns {Array} Array of pairwise comparison results
 */
export const ballotToPairwise = (ballot, candidates, ruleType = BALLOT_PROCESSING_RULES.ALASKA) => {
  const comparisonFunction = getPairwiseComparisonFunction(ruleType);
  const comparisons = [];
  const candidateIds = candidates.map(c => c.id);
  
  for (let i = 0; i < candidateIds.length; i++) {
    for (let j = i + 1; j < candidateIds.length; j++) {
      const cand1 = candidateIds[i];
      const cand2 = candidateIds[j];
      const comparison = comparisonFunction(ballot, cand1, cand2);
      
      if (comparison !== null) {
        comparisons.push({
          candidates: [cand1, cand2],
          result: comparison
        });
      }
    }
  }
  
  return comparisons;
};