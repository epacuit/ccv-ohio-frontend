// utils/ballotValidation.js
// Corrected validation system that uses poll settings for processing rules

import { 
  BALLOT_PROCESSING_RULES,
  hasSkippedRank,
  hasSkippedRankAbove,
  truncateBallot,
  ballotToPairwise,
  getPairwiseComparisonFunction
} from './ballotProcessingRules';

/**
 * Validates ballot based on poll settings 
 * Processing rules (Alaska/truncation) affect pairwise comparisons, NOT ballot validity
 * @param {Object} selections - Object with candidateId as key, rank as value
 * @param {Array} candidates - Array of candidate objects
 * @param {Object} settings - Poll settings object (contains ballot_processing_rule)
 * @returns {Object} Validation result
 */
export const validateBallotForSubmission = (selections, candidates = [], settings = {}) => {
  const ranksUsed = Object.values(selections).map(r => parseInt(r));
  const uniqueRanks = [...new Set(ranksUsed)].sort((a, b) => a - b);
  const totalCandidates = candidates.length;
  const rankedCandidates = Object.keys(selections).length;
  const ruleType = settings?.ballot_processing_rule || BALLOT_PROCESSING_RULES.ALASKA;
  
  // Empty ballot handling
  if (rankedCandidates === 0) {
    if (settings?.require_complete_ranking) {
      return {
        canSubmit: false,
        canShowMatchups: true,
        processingLevel: 'incomplete',
        warnings: [],
        errors: [`You must rank all ${totalCandidates} candidates.`],
        ruleType
      };
    }
    return { 
      canSubmit: true,
      canShowMatchups: true,
      processingLevel: 'normal',
      warnings: [],
      errors: [],
      ruleType
    };
  }
  
  // Complete ranking requirement check
  if (settings?.require_complete_ranking) {
    if (rankedCandidates < totalCandidates) {
      return {
        canSubmit: false,
        canShowMatchups: true,
        processingLevel: 'incomplete',
        warnings: [],
        errors: [`You must rank all ${totalCandidates} candidates. Currently ranked: ${rankedCandidates}.`],
        ruleType
      };
    }
    
    // For complete ranking with no ties, check for proper sequence
    if (!settings?.allow_ties) {
      const expectedRanks = Array.from({length: totalCandidates}, (_, i) => i + 1);
      const missingRanks = expectedRanks.filter(rank => !ranksUsed.includes(rank));
      
      if (missingRanks.length > 0) {
        return {
          canSubmit: false,
          canShowMatchups: true,
          processingLevel: 'incomplete',
          warnings: [],
          errors: [`Missing ranks: ${missingRanks.join(', ')}. Each candidate must have a unique rank from 1 to ${totalCandidates}.`],
          ruleType
        };
      }
    }
  }
  
  // Check for processing-specific warnings (but these don't affect validity)
  const processingResult = getProcessingWarnings(selections, candidates, ruleType);
  
  return {
    canSubmit: true, // Processing rules don't affect ballot validity
    canShowMatchups: true,
    processingLevel: processingResult.processingLevel,
    warnings: processingResult.warnings,
    errors: [],
    ruleType,
    truncateAfterRank: processingResult.truncateAfterRank
  };
};

/**
 * Get warnings based on processing rules and generate specific messages
 * @param {Object} selections - Object with candidateId as key, rank as value
 * @param {Array} candidates - Array of candidate objects
 * @param {string} ruleType - Processing rule type
 * @returns {Object} Processing warnings and info with specific messages
 */
export const getProcessingWarnings = (selections, candidates, ruleType) => {
  const ranksUsed = Object.values(selections).map(r => parseInt(r));
  const uniqueRanks = [...new Set(ranksUsed)].sort((a, b) => a - b);
  const warnings = [];
  
  // Find all skipped ranks
  const allSkippedRanks = [];
  if (uniqueRanks.length > 0) {
    const maxRank = Math.max(...uniqueRanks);
    for (let rank = 1; rank <= maxRank; rank++) {
      if (!ranksUsed.includes(rank)) {
        allSkippedRanks.push(rank);
      }
    }
  }
  
  // Find unranked candidates
  const rankedCandidateIds = Object.keys(selections);
  const unrankedCandidates = candidates.filter(c => !rankedCandidateIds.includes(c.id));
  
  // Check if there are undefined matchups
  const compareFunction = getPairwiseComparisonFunction(ruleType);
  let hasUndefinedMatchups = false;
  
  // Check all possible matchups to see if any are undefined
  for (let i = 0; i < candidates.length && !hasUndefinedMatchups; i++) {
    for (let j = i + 1; j < candidates.length && !hasUndefinedMatchups; j++) {
      const result = compareFunction(selections, candidates[i].id, candidates[j].id);
      if (result === null) {
        hasUndefinedMatchups = true;
      }
    }
  }
  
  if (ruleType === BALLOT_PROCESSING_RULES.TRUNCATION) {
    // Truncation rule warnings
    let truncateAfterRank = null;
    
    for (let i = 0; i < uniqueRanks.length - 1; i++) {
      const currentRank = uniqueRanks[i];
      const nextRank = uniqueRanks[i + 1];
      const gap = nextRank - currentRank - 1;
      
      if (gap >= 2) {
        const skippedRanks = Array.from({length: gap}, (_, j) => currentRank + 1 + j);
        warnings.push(`Ballot will be truncated after rank ${currentRank} due to ${gap} consecutive skipped ranks (${skippedRanks.join(', ')})`);
        truncateAfterRank = currentRank;
        break;
      }
    }
    
    // Add skipped ranks message if any
    if (allSkippedRanks.length > 0) {
      const skippedText = allSkippedRanks.length === 1 ? 
        `You have skipped rank ${allSkippedRanks[0]}.` :
        `You have skipped ranks ${allSkippedRanks.slice(0, -1).join(', ')}, and ${allSkippedRanks.slice(-1)[0]}.`;
      
      if (hasUndefinedMatchups) {
        warnings.push(`${skippedText} This affects how some one-on-one matchups are determined.`);
      } else {
        warnings.push(skippedText);
      }
    }
    
    return {
      processingLevel: truncateAfterRank !== null ? 'truncated' : 
                     warnings.length > 0 ? 'warning' : 'normal',
      warnings,
      truncateAfterRank,
      skippedRanks: allSkippedRanks,
      unrankedCandidates
    };
    
  } else {
    // Alaska rule warnings
    
    // Add skipped ranks message if any
    if (allSkippedRanks.length > 0) {
      const skippedText = allSkippedRanks.length === 1 ? 
        `You have skipped rank ${allSkippedRanks[0]}.` :
        `You have skipped ranks ${allSkippedRanks.slice(0, -1).join(', ')}, and ${allSkippedRanks.slice(-1)[0]}.`;
      
      if (hasUndefinedMatchups) {
        warnings.push(`${skippedText} This affects how some one-on-one matchups are determined.`);
      } else {
        warnings.push(skippedText);
      }
    }
    
    // Add unranked candidates message if any
    if (unrankedCandidates.length > 0) {
      const unrankedNames = unrankedCandidates.map(c => c.name);
      const unrankedText = unrankedNames.length === 1 ?
        `You have not ranked ${unrankedNames[0]}.` :
        `You have not ranked ${unrankedNames.slice(0, -1).join(', ')}, and ${unrankedNames.slice(-1)[0]}.`;
      
      warnings.push(unrankedText);
    }
    
    return {
      processingLevel: warnings.length > 0 ? 'warning' : 'normal',
      warnings,
      truncateAfterRank: null,
      skippedRanks: allSkippedRanks,
      unrankedCandidates
    };
  }
};

/**
 * Get the effective ballot for display purposes based on processing rules
 * @param {Object} selections - Original selections
 * @param {Object} validationResult - Result from validation
 * @returns {Object} Effective selections for display
 */
export const getEffectiveBallot = (selections, validationResult) => {
  // For truncation rules, apply truncation if needed
  if (validationResult.ruleType === BALLOT_PROCESSING_RULES.TRUNCATION && 
      validationResult.truncateAfterRank) {
    return truncateBallot(selections);
  }
  
  // For Alaska rules or no truncation needed, return original
  return selections;
};

/**
 * Check if ballot can show meaningful matchups - always true now since processing rules don't affect validity
 * @param {Object} selections - Object with candidateId as key, rank as value
 * @param {Array} candidates - Array of candidate objects
 * @param {string} ruleType - Processing rule type
 * @returns {boolean} Whether matchups can be shown
 */
export const canShowMatchups = (selections, candidates, ruleType = BALLOT_PROCESSING_RULES.ALASKA) => {
  return true; // Processing rules affect how comparisons are determined, not whether we can show them
};

/**
 * Get all pairwise comparisons for matchup display
 * @param {Object} selections - Object with candidateId as key, rank as value
 * @param {Array} candidates - Array of candidate objects
 * @param {string} ruleType - Processing rule type
 * @returns {Array} Array of pairwise comparison results
 */
export const getPairwiseComparisons = (selections, candidates, ruleType = BALLOT_PROCESSING_RULES.ALASKA) => {
  return ballotToPairwise(selections, candidates, ruleType);
};