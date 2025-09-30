
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Button,
  Collapse,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  EmojiEvents as TrophyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import CondorcetWinner from './explanations/CondorcetWinner';
import CopelandWinner from './explanations/CopelandWinner';
import MinimaxWinner from './explanations/MinimaxWinner';
import TiedWinners from './explanations/TiedWinners';
import WeakCondorcetWinner from './explanations/WeakCondorcetWinner';
import VoteComparison from './shared/VoteComparison';
import { WINNER_TYPE_COLORS } from '../constants/winnerColors';

/**
 * WinnerExplanation Component
 * 
 * Correctly explains how the winner is determined using the backend's
 * MWSL (Most Wins Smallest Loss) method:
 * 
 * 1. First check for Condorcet winner (beats everyone head-to-head)
 * 2. If no Condorcet winner exists:
 *    - Find candidates with the most wins (Copeland score with 0.5 for ties)
 *    - If only one has most wins, they win
 *    - If multiple have most wins, compare their loss sequences
 *    - The one with the smallest losses wins (minimax criterion)
 *    - If still tied, it's a true tie
 */
const WinnerExplanation = ({ 
  results, 
  winner, 
  tiedWinners,
  winnerType
}) => {
  const [expandedMatchups, setExpandedMatchups] = useState(new Set());
  
  if (!results) return null;
  
  // Get data from backend results
  const { 
    pairwise_matrix,
    copeland_scores,
    explanation,
    statistics,
    ballot_types = [],
    total_voters = 0,
    candidates = []
  } = results;
  
  // Toggle expansion for a specific matchup
  const toggleMatchupDetails = (matchupKey) => {
    setExpandedMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchupKey)) {
        newSet.delete(matchupKey);
      } else {
        newSet.add(matchupKey);
      }
      return newSet;
    });
  };
  
  // Calculate votes for a matchup from pairwise matrix
  const calculateVotes = (candidateA, candidateB) => {
    if (!pairwise_matrix || !pairwise_matrix[candidateA] || !pairwise_matrix[candidateB]) {
      return { winnerVotes: 0, opponentVotes: 0 };
    }
    
    const margin = pairwise_matrix[candidateA][candidateB] || 0;
    const totalInMatchup = total_voters;
    
    // The margin tells us the net advantage
    // If margin is positive, candidateA wins by that much
    // If margin is negative, candidateB wins by that much
    const winnerVotes = Math.floor((totalInMatchup + margin) / 2);
    const opponentVotes = totalInMatchup - winnerVotes;
    
    return { winnerVotes, opponentVotes };
  };
  
  // Get ballot support data for a matchup
  const getBallotSupport = (candidateA, candidateB) => {
    // This would analyze ballot_types to show how each ballot pattern voted
    // For now, return basic structure
    const support = {
      candidateAOnly: [],
      candidateBOnly: [],
      both: [],
      neither: [],
    };
    
    ballot_types.forEach((ballotType, idx) => {
      const { ranking, count } = ballotType;
      
      // Check if candidates are ranked
      let aRank = null;
      let bRank = null;
      
      ranking.forEach((tier, rank) => {
        if (tier.includes(candidateA)) aRank = rank + 1;
        if (tier.includes(candidateB)) bRank = rank + 1;
      });
      
      if (aRank !== null && bRank !== null) {
        support.both.push({ 
          ballotTypeIndex: idx, 
          count,
          preferA: aRank < bRank,
          preferB: bRank < aRank,
          tied: aRank === bRank
        });
      } else if (aRank !== null) {
        support.candidateAOnly.push({ ballotTypeIndex: idx, count });
      } else if (bRank !== null) {
        support.candidateBOnly.push({ ballotTypeIndex: idx, count });
      } else {
        support.neither.push({ ballotTypeIndex: idx, count });
      }
    });
    
    return support;
  };
  
  // Build candidate records from pairwise matrix
  const buildCandidateRecords = () => {
    if (!pairwise_matrix || !candidates) return [];
    
    return candidates.map(candidate => {
      const record = {
        candidate,
        wins: 0,
        losses: 0,
        ties: 0,
        opponents: [],
        minimax_score: 0, // Worst loss margin (most negative)
      };
      
      candidates.forEach(opponent => {
        if (candidate === opponent) return;
        
        const margin = pairwise_matrix[candidate]?.[opponent] || 0;
        
        if (margin > 0) {
          record.wins++;
          record.opponents.push({
            opponent,
            result: 'win',
            margin: margin
          });
        } else if (margin < 0) {
          record.losses++;
          record.opponents.push({
            opponent,
            result: 'loss',
            margin: margin
          });
          // Track worst loss
          if (margin < record.minimax_score) {
            record.minimax_score = margin;
          }
        } else {
          record.ties++;
          record.opponents.push({
            opponent,
            result: 'tie',
            margin: 0
          });
        }
      });
      
      record.worst_loss_margin = Math.abs(record.minimax_score);
      return record;
    });
  };
  
  const candidateRecords = buildCandidateRecords();
  
  // Render the appropriate explanation based on winner type
  const renderExplanation = () => {
    // Handle ties
    if (winnerType === 'tie' || (tiedWinners && tiedWinners.length > 1)) {
      return (
        <TiedWinners
          results={results}
          tiedWinners={tiedWinners}
          winnerType={winnerType}
          calculateVotes={calculateVotes}
          getBallotSupport={getBallotSupport}
          expandedMatchups={expandedMatchups}
          toggleMatchupDetails={toggleMatchupDetails}
          ballotTypes={ballot_types}
          totalVoters={total_voters}
          candidates={candidates}
          candidateRecords={candidateRecords}
        />
      );
    }
    
    // Handle single winner cases
    switch (winnerType) {
      case 'condorcet':
        return (
          <CondorcetWinner
            results={results}
            winner={winner}
            calculateVotes={calculateVotes}
            getBallotSupport={getBallotSupport}
            expandedMatchups={expandedMatchups}
            toggleMatchupDetails={toggleMatchupDetails}
            ballotTypes={ballot_types}
            totalVoters={total_voters}
            candidates={candidates}
          />
        );
        
      case 'weak_condorcet':
        return (
          <WeakCondorcetWinner
            results={results}
            winner={winner}
            calculateVotes={calculateVotes}
            getBallotSupport={getBallotSupport}
            expandedMatchups={expandedMatchups}
            toggleMatchupDetails={toggleMatchupDetails}
            ballotTypes={ballot_types}
            totalVoters={total_voters}
            candidates={candidates}
          />
        );
        
      case 'most_wins':
      case 'copeland':
        return (
          <CopelandWinner
            results={results}
            winner={winner}
            candidateRecords={candidateRecords}
            calculateVotes={calculateVotes}
            getBallotSupport={getBallotSupport}
            ballotTypes={ballot_types}
            totalVoters={total_voters}
          />
        );
        
      case 'smallest_loss':
      case 'minimax':
        return (
          <MinimaxWinner
            results={results}
            winner={winner}
            candidateRecords={candidateRecords}
            calculateVotes={calculateVotes}
            getBallotSupport={getBallotSupport}
            ballotTypes={ballot_types}
            totalVoters={total_voters}
          />
        );
        
      default:
        return (
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary">
              Winner determination method: {winnerType}
            </Typography>
          </Box>
        );
    }
  };
  
  // Algorithm explanation box
  const renderAlgorithmExplanation = () => {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4,
          backgroundColor: alpha('#1976d2', 0.05),
          border: '1px solid',
          borderColor: alpha('#1976d2', 0.2),
        }}
      >
        <Box display="flex" alignItems="flex-start">
          <InfoIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              How the Winner is Determined (MWSL Method)
            </Typography>
            <Typography variant="body2" paragraph>
              This voting system uses the <strong>Most Wins, Smallest Loss (MWSL)</strong> method to find the consensus choice:
            </Typography>
            <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
              <Typography variant="body2" component="li">
                <strong>Check for Condorcet Winner:</strong> A candidate who beats every other candidate in head-to-head comparisons wins immediately.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>If no Condorcet winner, use Copeland scores:</strong> Count wins (1 point), ties (0.5 points), and losses (0 points) for each candidate.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>If one candidate has the most wins:</strong> They win by having the best win-loss record.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>If multiple candidates tie for most wins:</strong> Compare their losses. The candidate with the smallest worst loss (minimax) wins.
              </Typography>
              <Typography variant="body2" component="li">
                <strong>If still tied:</strong> Multiple candidates share the victory.
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              This method finds candidates with broad support while minimizing the severity of their weaknesses.
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box>
      {renderAlgorithmExplanation()}
      {renderExplanation()}
      
      {/* Debug information for development */}
      {process.env.NODE_ENV === 'development' && (
        <Accordion sx={{ mt: 4 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">Debug: Raw Backend Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ fontSize: '11px', overflow: 'auto' }}>
              {JSON.stringify({
                winner_type: winnerType,
                winner,
                tiedWinners,
                copeland_scores,
                explanation,
                pairwise_matrix,
              }, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default WinnerExplanation;