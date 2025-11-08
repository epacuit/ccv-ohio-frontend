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
          
          // Properly extract vote counts
          let aOverB = 0;
          let bOverA = 0;
          
          // Check if we have the forward key
          if (detailedResults[detailKey]) {
            aOverB = detailedResults[detailKey][candidateA] || 0;
            bOverA = detailedResults[detailKey][candidateB] || 0;
          } 
          // Check if we have the reverse key
          else if (detailedResults[reverseDetailKey]) {
            aOverB = detailedResults[reverseDetailKey][candidateA] || 0;
            bOverA = detailedResults[reverseDetailKey][candidateB] || 0;
          }
          
          let matchup = {
            candidateA: candidateA,
            candidateB: candidateB,
            winner: null,
            loser: null,
            margin: 0,
            isTie: false,
            details: {
              aOverB: aOverB,
              bOverA: bOverA,
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
  
  // Calculate wins, losses, ties for each candidate BEFORE sorting
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
  
  // Sort matchups by winner's total wins, then alphabetically
  allMatchups.sort((a, b) => {
    // Put ties at the end
    if (a.isTie && !b.isTie) return 1;
    if (!a.isTie && b.isTie) return -1;
    
    // For non-ties, sort by winner's total wins
    if (!a.isTie && !b.isTie) {
      const aWinnerStats = candidateStats[a.winner];
      const bWinnerStats = candidateStats[b.winner];
      
      // Sort by number of wins (descending)
      if (aWinnerStats.wins !== bWinnerStats.wins) {
        return bWinnerStats.wins - aWinnerStats.wins;
      }
      
      // If same number of wins, sort by winner name alphabetically
      if (a.winner !== b.winner) {
        return a.winner.localeCompare(b.winner);
      }
      
      // Same winner, sort by loser name alphabetically
      return a.loser.localeCompare(b.loser);
    }
    
    // For ties, sort alphabetically by first candidate then second
    if (a.isTie && b.isTie) {
      if (a.winner !== b.winner) {
        return a.winner.localeCompare(b.winner);
      }
      return a.loser.localeCompare(b.loser);
    }
    
    return 0;
  });
  
  // Helper function to render a matchup bar
  const renderMatchupBar = (matchup) => {
    const totalVotes = results.statistics?.total_votes || 100;
    
    // Calculate percentages for visualization - ONLY based on voters with an opinion
    let winnerPercentage, loserPercentage, winnerVotes, loserVotes;
    
    if (matchup.isTie) {
      // Equal split for ties
      winnerPercentage = 50;
      loserPercentage = 50;
      winnerVotes = matchup.winner === matchup.candidateA ? matchup.details.aOverB : matchup.details.bOverA;
      loserVotes = matchup.winner === matchup.candidateA ? matchup.details.bOverA : matchup.details.aOverB;
    } else {
      // Calculate based on voters who have an opinion (exclude ties and undefined)
      // Only count voters who ranked one candidate above the other
      const totalWithOpinion = matchup.details.aOverB + matchup.details.bOverA;
      if (totalWithOpinion > 0) {
        // Correctly map winner/loser to the vote counts
        winnerVotes = matchup.winner === matchup.candidateA ? matchup.details.aOverB : matchup.details.bOverA;
        loserVotes = matchup.winner === matchup.candidateA ? matchup.details.bOverA : matchup.details.aOverB;
        winnerPercentage = (winnerVotes / totalWithOpinion) * 100;
        loserPercentage = (loserVotes / totalWithOpinion) * 100;
      } else {
        // Fallback visualization
        const dominance = Math.min(matchup.margin / totalVotes * 100 + 50, 85);
        winnerPercentage = dominance;
        loserPercentage = 100 - dominance;
        winnerVotes = 0;
        loserVotes = 0;
      }
    }
    
    // Build tooltip content - WHITE TEXT ON DARK BACKGROUND
    const tooltipContent = (
      <Box sx={{ p: 1 }}>
        <Typography 
          variant="body1"  
          sx={{ 
            fontWeight: 700,  
            mb: 1, 
            color: '#FFFFFF',  // WHITE text for readability on dark tooltip
            fontSize: '1rem'
          }}
        >
          <strong>{matchup.candidateA} vs {matchup.candidateB}</strong>
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          {matchup.details.aOverB.toLocaleString()} ballots rank {matchup.candidateA} above {matchup.candidateB}
        </Typography>
        <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          {matchup.details.bOverA.toLocaleString()} ballots rank {matchup.candidateB} above {matchup.candidateA}
        </Typography>
        {!matchup.isTie && (
          <Typography 
            variant="caption" 
            display="block" 
            sx={{ 
              mt: 1, 
              fontWeight: 700, 
              color: '#FFFFFF',
              fontSize: '0.85rem'
            }}
          >
            <strong>{matchup.winner} wins by a margin of {matchup.margin.toLocaleString()}</strong>
          </Typography>
        )}
      </Box>
    );
    
    // Determine which candidate to show first (winner always on left)
    const leftCandidate = matchup.winner;
    const rightCandidate = matchup.loser;
    const leftIsA = leftCandidate === matchup.candidateA;
    const leftVotes = leftIsA ? matchup.details.aOverB : matchup.details.bOverA;
    const rightVotes = leftIsA ? matchup.details.bOverA : matchup.details.aOverB;
    const leftPercentage = winnerPercentage;
    const rightPercentage = loserPercentage;
    
    // Rectangle dimensions - wider for better visibility
    const rectWidth = 200;
    const rectHeight = 40;
    const divideX = (leftPercentage / 100) * rectWidth;
    const centerX = rectWidth / 2;
    
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ 
          mb: 2, 
          px: 2,
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.01)',
          }
        }}>
          {/* Horizontal layout: Name | Rectangle | Name with percentages */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {/* Left candidate (winner) */}
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: !matchup.isTie ? 600 : 400,
                  color: !matchup.isTie ? 'success.main' : 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {leftCandidate}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                {Math.round(leftPercentage)}% ({leftVotes.toLocaleString()})
              </Typography>
            </Box>
            
            {/* Split Rectangle - vertical split with green on left, red on right */}
            <Box sx={{ position: 'relative', width: `${rectWidth}px`, height: `${rectHeight}px`, flexShrink: 0 }}>
              <svg width={rectWidth} height={rectHeight} viewBox={`0 0 ${rectWidth} ${rectHeight}`}>
                {/* Left side (winner - green) - rounded on left only */}
                <path
                  d={`M 4 0 L ${divideX} 0 L ${divideX} ${rectHeight} L 4 ${rectHeight} A 4 4 0 0 1 0 ${rectHeight - 4} L 0 4 A 4 4 0 0 1 4 0`}
                  fill={!matchup.isTie ? "#2e7d32" : "#757575"}
                />
                
                {/* Right side (loser - red) - rounded on right only */}
                <path
                  d={`M ${divideX} 0 L ${rectWidth - 4} 0 A 4 4 0 0 1 ${rectWidth} 4 L ${rectWidth} ${rectHeight - 4} A 4 4 0 0 1 ${rectWidth - 4} ${rectHeight} L ${divideX} ${rectHeight} L ${divideX} 0`}
                  fill={!matchup.isTie ? "#d32f2f" : "#757575"}
                />
                
                {/* 50-50 line (light gray) at center */}
                <line
                  x1={centerX}
                  y1="0"
                  x2={centerX}
                  y2={rectHeight}
                  stroke="#d0d0d0"
                  strokeWidth="1"
                  opacity="0.6"
                />
                
                {/* Border rectangle */}
                <rect
                  x="0"
                  y="0"
                  width={rectWidth}
                  height={rectHeight}
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="1"
                  rx="4"
                />
              </svg>
            </Box>
            
            {/* Right candidate (loser) */}
            <Box sx={{ flex: 1, textAlign: 'left' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 400,
                  color: 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {rightCandidate}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
              >
                {Math.round(rightPercentage)}% ({rightVotes.toLocaleString()})
              </Typography>
            </Box>
          </Box>
        </Box>
      </Tooltip>
    );
  };
  
  // Determine how many matchups to show
  const matchupsToShow = showAllMatchups ? allMatchups : allMatchups.slice(0, 5);
  const hasMore = allMatchups.length > 5;
  
  // Check if there are any ties in the data
  const hasAnyTies = Object.values(candidateStats).some(stats => stats.ties > 0);
  
  // Determine grid columns based on whether we have ties
  const gridColumns = hasAnyTies ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr';
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            fontSize: { xs: '1.1rem', sm: '1.25rem' }
          }}
        >
          Head-to-Head Comparisons
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
              gridTemplateColumns: gridColumns,
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
              {hasAnyTies && (
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
                  Ties
                </Typography>
              )}
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
                      gridTemplateColumns: gridColumns,
                      gap: 1,
                      px: 2,
                      py: 1.25,
                      bgcolor: isWinner ? alpha(winnerColor, 0.1) : 'background.paper',
                      borderBottom: index < candidates.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
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
                    {hasAnyTies && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}
                      >
                        {stats.ties}
                      </Typography>
                    )}
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ overflow: 'auto' }}>
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