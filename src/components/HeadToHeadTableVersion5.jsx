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
    
    // Determine which candidate to show first (winner always on top)
    const topCandidate = matchup.winner;
    const bottomCandidate = matchup.loser;
    const topIsA = topCandidate === matchup.candidateA;
    const topVotes = topIsA ? matchup.details.aOverB : matchup.details.bOverA;
    const bottomVotes = topIsA ? matchup.details.bOverA : matchup.details.aOverB;
    const topPercentage = winnerPercentage;
    const bottomPercentage = loserPercentage;
    
    // Calculate circles representation (10 circles = 100%, so each circle = 10%)
    const topCirclesCount = topPercentage / 10; // e.g., 52% = 5.2 circles
    const bottomCirclesCount = bottomPercentage / 10; // e.g., 48% = 4.8 circles
    
    const topFullCircles = Math.floor(topCirclesCount);
    const topPartialFill = topCirclesCount - topFullCircles; // 0-1 representing percentage of last circle
    
    const bottomFullCircles = Math.floor(bottomCirclesCount);
    const bottomPartialFill = bottomCirclesCount - bottomFullCircles;
    
    // Create unique IDs for this matchup
    const topClipId = `clip-${topCandidate}-${bottomCandidate}-top`;
    const bottomClipId = `clip-${topCandidate}-${bottomCandidate}-bottom`;
    
    // Render circles
    const renderCircles = (fullCount, partialFill, color, clipId) => {
      const circles = [];
      const radius = 10;
      const size = radius * 2;
      
      // Full circles
      for (let i = 0; i < fullCount; i++) {
        circles.push(
          <svg key={`full-${i}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ marginRight: '3px' }}>
            <circle cx={radius} cy={radius} r={radius - 1} fill={color} />
          </svg>
        );
      }
      
      // Partial circle (if any) - using arc/pie slice
      if (partialFill > 0) {
        // Calculate the angle for the arc (0 = top, goes clockwise)
        const angle = partialFill * 360;
        const radians = (angle - 90) * Math.PI / 180;
        const x = radius + (radius - 1) * Math.cos(radians);
        const y = radius + (radius - 1) * Math.sin(radians);
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        circles.push(
          <svg key="partial" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ marginRight: '3px' }}>
            {/* Background: empty circle outline */}
            <circle cx={radius} cy={radius} r={radius - 1} fill="none" stroke="#e0e0e0" strokeWidth="1.5" />
            
            {/* Foreground: pie slice showing partial fill */}
            {partialFill > 0 && (
              <path
                d={`M ${radius} ${radius} L ${radius} 1 A ${radius - 1} ${radius - 1} 0 ${largeArcFlag} 1 ${x} ${y} Z`}
                fill={color}
              />
            )}
          </svg>
        );
      }
      
      return circles;
    };
    
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
          {/* Two rows: winner on top, loser below */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Top candidate (winner) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Candidate name */}
              <Typography 
                variant="body2" 
                sx={{ 
                  minWidth: '100px',
                  fontWeight: !matchup.isTie ? 600 : 400,
                  color: !matchup.isTie ? 'success.main' : 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {topCandidate}
              </Typography>
              
              {/* Circles and percentage/count together */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Circles */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {renderCircles(topFullCircles, topPartialFill, !matchup.isTie ? "#2e7d32" : "#757575", topClipId)}
                </Box>
                
                {/* Percentage and count */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(topPercentage)}% ({topVotes.toLocaleString()})
                </Typography>
              </Box>
            </Box>

            {/* Bottom candidate (loser) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Candidate name */}
              <Typography 
                variant="body2" 
                sx={{ 
                  minWidth: '100px',
                  fontWeight: 400,
                  color: 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {bottomCandidate}
              </Typography>
              
              {/* Circles and percentage/count together */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Circles */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {renderCircles(bottomFullCircles, bottomPartialFill, !matchup.isTie ? "#d32f2f" : "#757575", bottomClipId)}
                </Box>
                
                {/* Percentage and count */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {Math.round(bottomPercentage)}% ({bottomVotes.toLocaleString()})
                </Typography>
              </Box>
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