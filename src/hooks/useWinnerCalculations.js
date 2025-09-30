import { useState, useCallback, useMemo } from 'react';

/**
 * useWinnerCalculations Hook
 * 
 * Extracts all calculation logic from WinnerExplanation component.
 * Provides vote calculations, ballot support analysis, and win-loss records.
 * 
 * @param {Object} results - Election results data
 * @returns {Object} Calculation methods and data
 */
export const useWinnerCalculations = (results) => {
  const [expandedMatchups, setExpandedMatchups] = useState(new Set());
  const [expandedAdditionalMatchups, setExpandedAdditionalMatchups] = useState(new Set());
  
  /**
   * Calculate votes for any two candidates
   */
  const calculateVotes = useCallback((candidateA, candidateB) => {
    let aVotes = 0;
    let bVotes = 0;
    
    results.ballot_types.forEach((ballotType) => {
      let aRank = -1;
      let bRank = -1;
      
      // Find ranks for both candidates
      ballotType.ranking.forEach((tier, tierIndex) => {
        if (tier && Array.isArray(tier)) {
          if (tier.includes(candidateA)) aRank = tierIndex;
          if (tier.includes(candidateB)) bRank = tierIndex;
        }
      });
      
      // Compare ranks (lower rank number = higher preference)
      if (aRank !== -1 && bRank !== -1) {
        if (aRank < bRank) {
          aVotes += ballotType.count;
        } else if (bRank < aRank) {
          bVotes += ballotType.count;
        }
        // If aRank === bRank, they're tied, no votes added
      } else if (aRank !== -1 && bRank === -1) {
        // Only A is ranked
        aVotes += ballotType.count;
      } else if (bRank !== -1 && aRank === -1) {
        // Only B is ranked
        bVotes += ballotType.count;
      }
    });
    
    // Return in the format expected by existing code
    return { 
      winnerVotes: aVotes, 
      opponentVotes: bVotes,
      aVotes,
      bVotes,
      margin: aVotes - bVotes
    };
  }, [results.ballot_types]);
  
  /**
   * Get ballot types that support each candidate
   */
  const getBallotSupport = useCallback((candidateA, candidateB) => {
    const aSupport = [];
    const bSupport = [];
    const tiedSupport = [];
    
    results.ballot_types.forEach((ballotType, index) => {
      let aRank = -1;
      let bRank = -1;
      
      // Find ranks for both candidates
      ballotType.ranking.forEach((tier, tierIndex) => {
        if (tier && Array.isArray(tier)) {
          if (tier.includes(candidateA)) aRank = tierIndex;
          if (tier.includes(candidateB)) bRank = tierIndex;
        }
      });
      
      // Compare ranks
      if (aRank !== -1 && bRank !== -1) {
        if (aRank < bRank) {
          aSupport.push(index);
        } else if (bRank < aRank) {
          bSupport.push(index);
        } else {
          // Same rank - tied
          tiedSupport.push(index);
        }
      } else if (aRank !== -1 && bRank === -1) {
        aSupport.push(index);
      } else if (bRank !== -1 && aRank === -1) {
        bSupport.push(index);
      } else {
        // Neither ranked
        tiedSupport.push(index);
      }
    });
    
    return { 
      aSupport, 
      bSupport, 
      tiedSupport,
      // Legacy support for old format
      winnerSupport: aSupport,
      opponentSupport: bSupport
    };
  }, [results.ballot_types]);
  
  /**
   * Get win-loss records from backend results
   */
  const getWinLossRecords = useCallback(() => {
    if (!results.candidate_records) return {};
    
    const records = {};
    results.candidate_records.forEach(record => {
      records[record.candidate] = record;
    });
    return records;
  }, [results.candidate_records]);
  
  /**
   * Calculate detailed stats for a candidate
   */
  const calculateCandidateStats = useCallback((candidate) => {
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let largestLossMargin = 0;
    const matchDetails = [];
    
    results.candidates.forEach(opponent => {
      if (opponent !== candidate) {
        const { aVotes, bVotes } = calculateVotes(candidate, opponent);
        const margin = aVotes - bVotes;
        
        if (margin > 0) {
          wins++;
          matchDetails.push({ opponent, result: 'win', margin });
        } else if (margin < 0) {
          losses++;
          matchDetails.push({ opponent, result: 'loss', margin: Math.abs(margin) });
          largestLossMargin = Math.max(largestLossMargin, Math.abs(margin));
        } else {
          ties++;
          matchDetails.push({ opponent, result: 'tie', margin: 0 });
        }
      }
    });
    
    return {
      wins,
      losses,
      ties,
      netWins: wins - losses,
      largestLossMargin,
      matchDetails
    };
  }, [results.candidates, calculateVotes]);
  
  /**
   * Toggle expanded state for matchups
   */
  const toggleMatchupDetails = useCallback((candidate) => {
    setExpandedMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidate)) {
        newSet.delete(candidate);
      } else {
        newSet.add(candidate);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Toggle expanded state for additional matchups
   */
  const toggleAdditionalMatchupDetails = useCallback((matchupKey) => {
    setExpandedAdditionalMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchupKey)) {
        newSet.delete(matchupKey);
      } else {
        newSet.add(matchupKey);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Get all possible matchups between candidates
   */
  const getAllMatchups = useMemo(() => {
    const matchups = [];
    
    for (let i = 0; i < results.candidates.length; i++) {
      for (let j = i + 1; j < results.candidates.length; j++) {
        matchups.push({
          candidateA: results.candidates[i],
          candidateB: results.candidates[j],
          key: `${results.candidates[i]}-${results.candidates[j]}`
        });
      }
    }
    
    return matchups;
  }, [results.candidates]);
  
  return {
    // Calculation methods
    calculateVotes,
    getBallotSupport,
    getWinLossRecords,
    calculateCandidateStats,
    
    // UI state
    expandedMatchups,
    expandedAdditionalMatchups,
    toggleMatchupDetails,
    toggleAdditionalMatchupDetails,
    
    // Data
    getAllMatchups,
    totalVoters: results.total_voters,
    candidates: results.candidates,
    ballotTypes: results.ballot_types,
  };
};