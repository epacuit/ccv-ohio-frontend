import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import VoteComparison from '../shared/VoteComparison';
import { WINNER_TYPE_COLORS } from '../../constants/winnerColors';

/**
 * CondorcetWinner Component
 * 
 * Handles the display when there is a Condorcet winner.
 * Extracted from the massive WinnerExplanation.jsx.
 * ~350 lines focused on one scenario instead of 1500 lines handling everything.
 */
const CondorcetWinner = ({ 
  results, 
  winner, 
  calculateVotes, 
  getBallotSupport,
  expandedMatchups,
  toggleMatchupDetails,
  ballotTypes,
  totalVoters,
  candidates
}) => {
  const theme = useTheme();
  const [showAdditionalComparisons, setShowAdditionalComparisons] = useState(false);
  const [barValues, setBarValues] = useState({});
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const previousDataHashRef = useRef(null);
  
  // Create a hash of the data to detect changes
  const createDataHash = () => {
    if (!results || !winner) return null;
    const ballotData = ballotTypes.map(bt => bt.count).join(',');
    return `${winner}-${totalVoters}-${ballotData}`;
  };
  
  // Initialize and animate bar values only when data changes
  useEffect(() => {
    const currentDataHash = createDataHash();
    
    if (!currentDataHash) return;
    
    const dataChanged = currentDataHash !== previousDataHashRef.current;
    
    if (dataChanged) {
      // Data has changed, animate from 0
      setShouldAnimate(true);
      
      // Initialize to 0 for animation
      const initialValues = {};
      candidates.forEach(candidate => {
        if (candidate !== winner) {
          initialValues[candidate] = { winner: 0, opponent: 0 };
        }
      });
      setBarValues(initialValues);
      
      // Animate bars after a short delay
      const animationTimer = setTimeout(() => {
        const newValues = {};
        candidates.forEach(candidate => {
          if (candidate !== winner) {
            const { winnerVotes, opponentVotes } = calculateVotes(winner, candidate);
            newValues[candidate] = { winner: winnerVotes, opponent: opponentVotes };
          }
        });
        setBarValues(newValues);
        
        // Turn off animation after it completes
        setTimeout(() => {
          setShouldAnimate(false);
        }, 1600);
      }, 300);
      
      previousDataHashRef.current = currentDataHash;
      
      return () => clearTimeout(animationTimer);
    } else {
      // Data hasn't changed, just set the values without animation
      const finalValues = {};
      candidates.forEach(candidate => {
        if (candidate !== winner) {
          const { winnerVotes, opponentVotes } = calculateVotes(winner, candidate);
          finalValues[candidate] = { winner: winnerVotes, opponent: opponentVotes };
        }
      });
      setBarValues(finalValues);
    }
  }, [results, winner, candidates, calculateVotes, totalVoters, ballotTypes]);
  
  // Get all matchups not involving the winner
  const getAdditionalMatchups = () => {
    const matchups = [];
    const otherCandidates = candidates.filter(c => c !== winner);
    
    for (let i = 0; i < otherCandidates.length; i++) {
      for (let j = i + 1; j < otherCandidates.length; j++) {
        matchups.push({
          candidateA: otherCandidates[i],
          candidateB: otherCandidates[j],
        });
      }
    }
    
    return matchups;
  };
  
  const additionalMatchups = getAdditionalMatchups();
  
  return (
    <Box>
      {/* Header */}
      <Box textAlign="center" mb={5}>
        <Typography 
          variant="h5" 
          color="text.primary" 
          sx={{ 
            fontWeight: 400,
            letterSpacing: '0.5px',
          }}
        >
          {winner} beats every other candidate head-to-head
        </Typography>
      </Box>
      
      {/* Head-to-head comparisons */}
      <Grid container spacing={4} justifyContent="center">
        {candidates
          .filter(candidate => candidate !== winner)
          .map((opponent) => {
            const values = barValues[opponent] || { winner: 0, opponent: 0 };
            const supportData = getBallotSupport(winner, opponent);
            const isExpanded = expandedMatchups.has(opponent);
            
            return (
              <Grid item xs={12} md={10} lg={8} key={opponent}>
                <VoteComparison
                  candidateA={winner}
                  candidateB={opponent}
                  votesA={values.winner}
                  votesB={values.opponent}
                  totalVoters={totalVoters}
                  colorA={WINNER_TYPE_COLORS.win}
                  colorB={WINNER_TYPE_COLORS.loss}
                  animate={shouldAnimate}
                  ballotSupport={supportData}
                  ballotTypes={ballotTypes}
                  resultText={`${winner} wins by ${values.winner - values.opponent} votes`}
                  expanded={isExpanded}
                  onToggleExpanded={() => toggleMatchupDetails(opponent)}
                />
              </Grid>
            );
          })}
      </Grid>
      
      {/* Additional comparisons section */}
      {additionalMatchups.length > 0 && (
        <Box mt={6}>
          <Box textAlign="center">
            <Button
              variant="outlined"
              size="large"
              onClick={() => setShowAdditionalComparisons(!showAdditionalComparisons)}
              endIcon={<ArrowDownIcon sx={{ 
                transform: showAdditionalComparisons ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} />}
              sx={{
                textTransform: 'none',
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.grey[500], 0.08),
                }
              }}
            >
              Other head-to-head comparisons
            </Button>
          </Box>
          
          {/* Additional comparisons grid */}
          <Collapse in={showAdditionalComparisons}>
            <Box mt={4}>
              <Typography 
                variant="h6" 
                align="center" 
                gutterBottom
                sx={{ 
                  mb: 3,
                  color: 'text.secondary',
                  fontWeight: 400,
                }}
              >
                Other Head-to-Head Comparisons
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                {additionalMatchups.map((matchup) => {
                  const { winnerVotes: aVotes, opponentVotes: bVotes } = calculateVotes(
                    matchup.candidateA, 
                    matchup.candidateB
                  );
                  const supportData = getBallotSupport(matchup.candidateA, matchup.candidateB);
                  const isTied = aVotes === bVotes;
                  
                  const getMatchupColors = () => {
                    // For ties, arbitrarily assign green to first candidate
                    if (isTied) {
                      return { colorA: WINNER_TYPE_COLORS.win, colorB: WINNER_TYPE_COLORS.loss };
                    } else if (aVotes > bVotes) {
                      return { colorA: WINNER_TYPE_COLORS.win, colorB: WINNER_TYPE_COLORS.loss };
                    } else {
                      return { colorA: WINNER_TYPE_COLORS.loss, colorB: WINNER_TYPE_COLORS.win };
                    }
                  };
                  
                  const { colorA, colorB } = getMatchupColors();
                  
                  return (
                    <Grid item xs={12} md={10} lg={8} key={`${matchup.candidateA}-${matchup.candidateB}`}>
                      <VoteComparison
                        candidateA={matchup.candidateA}
                        candidateB={matchup.candidateB}
                        votesA={aVotes}
                        votesB={bVotes}
                        totalVoters={totalVoters}
                        colorA={colorA}
                        colorB={colorB}
                        animate={true}
                        ballotSupport={supportData}
                        ballotTypes={ballotTypes}
                        isTied={isTied}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default CondorcetWinner;