import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  alpha,
  Tooltip,
  Chip,
} from '@mui/material';

const HeadToHeadTable = ({ results, winnerColor }) => {
  const [showAllMatchups, setShowAllMatchups] = useState(false);
  
  // Get the pairwise matrix and detailed results
  const pairwiseMatrix = results.pairwise_matrix || {};
  const detailedResults = results.detailed_pairwise_results || {};
  const winner = results.winner;
  const tiedWinners = results.winners || [];
  const winnerNames = tiedWinners.length > 0 ? tiedWinners : (winner ? [winner] : []);
  
  // Get list of all candidates from the matrix keys
  const candidates = Object.keys(pairwiseMatrix);
  
  // Collect all matchups
  const allMatchups = [];
  const processedPairs = new Set();
  
  candidates.forEach(candidateA => {
    candidates.forEach(candidateB => {
      if (candidateA !== candidateB) {
        const pairKey = [candidateA, candidateB].sort().join('|');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          const marginA = pairwiseMatrix[candidateA]?.[candidateB] || 0;
          const marginB = pairwiseMatrix[candidateB]?.[candidateA] || 0;
          
          // Get detailed results for hover tooltip
          const detailKey = `${candidateA}_vs_${candidateB}`;
          const reverseDetailKey = `${candidateB}_vs_${candidateA}`;
          const details = detailedResults[detailKey] || detailedResults[reverseDetailKey] || {};
          
          let matchup = {
            winner: null,
            loser: null,
            margin: 0,
            isTie: false,
            details: {
              aOverB: details[candidateA] || 0,
              bOverA: details[candidateB] || 0,
              ties: details.ties || 0,
              undefined: details.undefined || 0,
            }
          };
          
          if (marginA > 0) {
            matchup.winner = candidateA;
            matchup.loser = candidateB;
            matchup.margin = marginA;
          } else if (marginB > 0) {
            matchup.winner = candidateB;
            matchup.loser = candidateA;
            matchup.margin = marginB;
          } else {
            // It's a tie
            matchup.winner = candidateA;
            matchup.loser = candidateB;
            matchup.isTie = true;
          }
          
          allMatchups.push(matchup);
        }
      }
    });
  });
  
  // Sort matchups: non-ties first (by margin), then ties
  allMatchups.sort((a, b) => {
    if (a.isTie && !b.isTie) return 1;
    if (!a.isTie && b.isTie) return -1;
    if (!a.isTie && !b.isTie) return b.margin - a.margin;
    return 0;
  });
  
  // Calculate wins, losses, ties for each candidate
  const candidateStats = {};
  candidates.forEach(candidate => {
    candidateStats[candidate] = { wins: 0, losses: 0, ties: 0 };
  });
  
  allMatchups.forEach(matchup => {
    if (matchup.isTie) {
      candidateStats[matchup.winner].ties++;
      candidateStats[matchup.loser].ties++;
    } else {
      candidateStats[matchup.winner].wins++;
      candidateStats[matchup.loser].losses++;
    }
  });
  
  // Helper function to render a matchup bar
  const renderMatchupBar = (matchup) => {
    const totalVotes = results.statistics?.total_votes || 100;
    
    // Calculate percentages for visualization
    let winnerPercentage, loserPercentage, tiePercentage;
    
    if (matchup.isTie) {
      // Equal split for ties
      winnerPercentage = 45;
      loserPercentage = 45;
      tiePercentage = 10;
    } else {
      // Calculate based on actual votes if available
      const totalInMatchup = matchup.details.aOverB + matchup.details.bOverA + matchup.details.ties;
      if (totalInMatchup > 0) {
        const winnerVotes = matchup.winner === matchup.winner ? matchup.details.aOverB : matchup.details.bOverA;
        const loserVotes = matchup.winner === matchup.winner ? matchup.details.bOverA : matchup.details.aOverB;
        winnerPercentage = (winnerVotes / totalInMatchup) * 100;
        loserPercentage = (loserVotes / totalInMatchup) * 100;
        tiePercentage = (matchup.details.ties / totalInMatchup) * 100;
      } else {
        // Fallback visualization
        const dominance = Math.min(matchup.margin / totalVotes * 100 + 50, 85);
        winnerPercentage = dominance;
        loserPercentage = 100 - dominance;
        tiePercentage = 0;
      }
    }
    
    // Build tooltip content
    const tooltipContent = (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {matchup.winner} vs {matchup.loser}
        </Typography>
        <Typography variant="caption" display="block">
          {matchup.details.aOverB} ballots rank {matchup.winner} above {matchup.loser}
        </Typography>
        <Typography variant="caption" display="block">
          {matchup.details.bOverA} ballots rank {matchup.loser} above {matchup.winner}
        </Typography>
        <Typography variant="caption" display="block">
          {matchup.details.ties} ballots rank them as tied
        </Typography>
        {matchup.details.undefined > 0 && (
          <Typography variant="caption" display="block">
            {matchup.details.undefined} ballots have undefined ranking
          </Typography>
        )}
        {!matchup.isTie && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>
            The margin of victory for {matchup.winner} is {matchup.margin}.
          </Typography>
        )}
      </Box>
    );
    
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ mb: 2, px: 2 }}>
          {/* Candidate names above the bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.5 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: matchup.isTie ? 500 : 600,
                color: matchup.isTie ? 'text.secondary' : 'success.main',
                fontSize: '0.875rem'
              }}
            >
              {matchup.winner}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: matchup.isTie ? 500 : 400,
                color: matchup.isTie ? 'text.secondary' : 'error.main',
                fontSize: '0.875rem'
              }}
            >
              {matchup.loser}
            </Typography>
          </Box>
          
          {/* Bar visualization */}
          <Box 
            sx={{ 
              display: 'flex', 
              height: 24, 
              borderRadius: 1, 
              overflow: 'hidden',
              bgcolor: 'grey.100',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
          >
            {/* Winner portion (green) */}
            {winnerPercentage > 0 && (
              <Box 
                sx={{ 
                  width: `${winnerPercentage}%`,
                  bgcolor: matchup.isTie ? 'grey.500' : 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: winnerPercentage > 15 ? 'auto' : 0,
                }}
              >
                {winnerPercentage >= 15 && `${Math.round(winnerPercentage)}%`}
              </Box>
            )}
            
            {/* Tie portion (gray) - if there are ties */}
            {tiePercentage > 2 && (
              <Box 
                sx={{ 
                  width: `${tiePercentage}%`,
                  bgcolor: 'grey.400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                {tiePercentage >= 10 && 'tie'}
              </Box>
            )}
            
            {/* Loser portion (red) */}
            {loserPercentage > 0 && (
              <Box 
                sx={{ 
                  width: `${loserPercentage}%`,
                  bgcolor: matchup.isTie ? 'grey.500' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: loserPercentage > 15 ? 'auto' : 0,
                }}
              >
                {loserPercentage >= 15 && `${Math.round(loserPercentage)}%`}
              </Box>
            )}
          </Box>
        </Box>
      </Tooltip>
    );
  };
  
  // Determine how many matchups to show
  const matchupsToShow = showAllMatchups ? allMatchups : allMatchups.slice(0, 5);
  const hasMore = allMatchups.length > 5;
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%',
        minHeight: 400,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" align="center" sx={{ mb: 3 }}>
          One-on-One Comparisons
        </Typography>
        
        {/* Candidate Standings Table */}
        <Box sx={{ 
          mb: 3, 
          px: 2,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Box sx={{
            width: '100%',
            maxWidth: 350,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: 1,
              px: 2,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Candidate
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
                Wins
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
                Losses
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
                Ties
              </Typography>
            </Box>
            
            {/* Table Rows */}
            {candidates
              .sort((a, b) => {
                // Sort by wins (descending), then by losses (ascending)
                const statsA = candidateStats[a];
                const statsB = candidateStats[b];
                if (statsA.wins !== statsB.wins) return statsB.wins - statsA.wins;
                if (statsA.losses !== statsB.losses) return statsA.losses - statsB.losses;
                return a.localeCompare(b);
              })
              .map((candidate, index) => {
                const stats = candidateStats[candidate];
                const isWinner = winnerNames.includes(candidate);
                return (
                  <Box
                    key={candidate}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: 1,
                      px: 2,
                      py: 1.25,
                      bgcolor: isWinner ? alpha(winnerColor, 0.05) : 'background.paper',
                      borderBottom: index < candidates.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      borderLeft: isWinner ? `3px solid ${winnerColor}` : 'none',
                      ml: isWinner ? '-1px' : 0 // Compensate for border
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: isWinner ? 600 : 400,
                        color: isWinner ? winnerColor : 'text.primary' 
                      }}
                    >
                      {candidate}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center',
                        fontWeight: stats.wins > 0 ? 500 : 400,
                        color: stats.wins > 0 ? 'success.main' : 'text.secondary'
                      }}
                    >
                      {stats.wins}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center',
                        fontWeight: stats.losses > 0 ? 500 : 400,
                        color: stats.losses > 0 ? 'error.main' : 'text.secondary'
                      }}
                    >
                      {stats.losses}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textAlign: 'center',
                        color: 'text.secondary'
                      }}
                    >
                      {stats.ties}
                    </Typography>
                  </Box>
                );
              })}
          </Box>
        </Box>
        
        {/* Section Divider */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            HEAD-TO-HEAD MATCHUPS
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {matchupsToShow.map((matchup, index) => (
          <Box key={index}>
            {renderMatchupBar(matchup)}
          </Box>
        ))}
      </Box>
      
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button 
            size="small"
            variant="text"
            onClick={() => setShowAllMatchups(!showAllMatchups)}
            sx={{ 
              textTransform: 'none',
              fontSize: '0.875rem',
            }}
          >
            {showAllMatchups ? 'Show less' : `Show ${allMatchups.length - 5} more comparisons`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default HeadToHeadTable;