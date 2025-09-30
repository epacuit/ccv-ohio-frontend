
import React, { useState } from 'react';
import {
  Box,
  Typography,
} from '@mui/material';

// Import sub-components
import CondorcetWinner from './explanations/CondorcetWinner';
import WeakCondorcetWinner from './explanations/WeakCondorcetWinner';
import CopelandWinner from './explanations/CopelandWinner';
import MinimaxWinner from './explanations/MinimaxWinner';
import TiedWinners from './explanations/TiedWinners';

/**
 * WinnerExplanation Component
 * 
 * Provides a visual explanation of how the winner(s) were determined
 * based on the winner type (Condorcet, weak Condorcet, Copeland, minimax, or tie).
 * 
 * @param {Object} results - The detailed results object from the backend
 * @param {string} winner - The determined winner (null if tied)
 * @param {Array} tiedWinners - Array of tied winners (empty if no tie)
 * @param {string} winnerType - Type of winner determination
 */
const WinnerExplanation = ({ results, winner, tiedWinners, winnerType }) => {
  const [expandedMatchups, setExpandedMatchups] = useState(new Set());
  
  if (!results) return null;
  
  // Extract data from results
  const { 
    ballot_types: ballotTypes = [], 
    total_voters: totalVoters,
    candidates = [],
    candidate_records: candidateRecords = []
  } = results;
  
  // Toggle expansion for a specific matchup
  const toggleMatchupDetails = (opponent) => {
    setExpandedMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(opponent)) {
        newSet.delete(opponent);
      } else {
        newSet.add(opponent);
      }
      return newSet;
    });
  };
  
  // Calculate support for candidates in head-to-head matchup
  const calculateVotes = (candidateA, candidateB) => {
    let winnerVotes = 0;
    let opponentVotes = 0;
    
    ballotTypes.forEach(ballotType => {
      const { ranking, count } = ballotType;
      
      // Find positions of both candidates
      let posA = -1;
      let posB = -1;
      
      for (let i = 0; i < ranking.length; i++) {
        if (ranking[i].includes(candidateA)) posA = i;
        if (ranking[i].includes(candidateB)) posB = i;
      }
      
      // Only count if both candidates are ranked
      if (posA !== -1 && posB !== -1) {
        if (posA < posB) {
          winnerVotes += count;
        } else if (posB < posA) {
          opponentVotes += count;
        }
        // If posA === posB, they're tied in this ranking
      } else if (posA !== -1 && posB === -1) {
        // Only A is ranked, A wins
        winnerVotes += count;
      } else if (posA === -1 && posB !== -1) {
        // Only B is ranked, B wins
        opponentVotes += count;
      }
      // If neither is ranked, neither gets votes from this ballot type
    });
    
    return { winnerVotes, opponentVotes };
  };
  
  // Get ballot types that support each candidate in a matchup
  const getBallotSupport = (candidateA, candidateB) => {
    const aSupport = [];
    const bSupport = [];
    const tiedSupport = [];
    
    ballotTypes.forEach((ballotType, index) => {
      const { ranking } = ballotType;
      
      let posA = -1;
      let posB = -1;
      
      for (let i = 0; i < ranking.length; i++) {
        if (ranking[i].includes(candidateA)) posA = i;
        if (ranking[i].includes(candidateB)) posB = i;
      }
      
      if (posA !== -1 && posB !== -1) {
        if (posA < posB) {
          aSupport.push(index);
        } else if (posB < posA) {
          bSupport.push(index);
        } else {
          tiedSupport.push(index);
        }
      } else if (posA !== -1 && posB === -1) {
        aSupport.push(index);
      } else if (posA === -1 && posB !== -1) {
        bSupport.push(index);
      } else {
        tiedSupport.push(index);
      }
    });
    
    return { aSupport, bSupport, tiedSupport };
  };
  
  // Props for sub-components
  const commonProps = {
    results,
    calculateVotes,
    getBallotSupport,
    expandedMatchups,
    toggleMatchupDetails,
    ballotTypes,
    totalVoters,
    candidates,
    candidateRecords
  };
  
  // Render the appropriate explanation based on winner type
  switch (winnerType) {
    case 'condorcet':
      return <CondorcetWinner {...commonProps} winner={winner} />;
      
    case 'weak_condorcet':
      return <WeakCondorcetWinner {...commonProps} winner={winner} />;
      
    case 'copeland':
      return <CopelandWinner {...commonProps} winner={winner} />;
      
    case 'minimax':
      return <MinimaxWinner {...commonProps} winner={winner} />;
      
    case 'tie':
    case 'tie_weak_condorcet':
    case 'tie_copeland':
    case 'tie_minimax':
      return <TiedWinners {...commonProps} tiedWinners={tiedWinners} winnerType={winnerType} />;
      
    default:
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No winner could be determined
          </Typography>
        </Box>
      );
  }
};

export default WinnerExplanation;