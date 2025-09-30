import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';

// Component to render two separate comparison bars
const ComparisonBars = ({ votesFor, votesAgainst, totalVoters, candidateName, opponentName }) => {
  const theme = useTheme();
  
  // Calculate percentages based only on voters who ranked one above the other
  const totalWithPreference = votesFor + votesAgainst;
  let forPercentage, againstPercentage;
  
  if (totalWithPreference === 0) {
    // No one expressed a preference - show 50/50
    forPercentage = 50;
    againstPercentage = 50;
  } else {
    forPercentage = (votesFor / totalWithPreference) * 100;
    againstPercentage = (votesAgainst / totalWithPreference) * 100;
  }
  
  // Calculate tie/no vote info for tooltip
  const tieOrNoVoteCount = totalVoters - votesFor - votesAgainst;
  const tieOrNoVotePercentage = totalVoters > 0 ? (tieOrNoVoteCount / totalVoters) * 100 : 0;
  
  // Proper singular/plural forms
  const voterText = (count) => count === 1 ? 'voter' : 'voters';
  
  const tooltipText = (
    <>
      <div>{totalWithPreference} {voterText(totalWithPreference)} had a preference between {candidateName} and {opponentName}</div>
      <div>{votesFor} {voterText(votesFor)} ranked {candidateName} higher ({forPercentage.toFixed(1)}% of those with preference)</div>
      <div>{votesAgainst} {voterText(votesAgainst)} ranked {opponentName} higher ({againstPercentage.toFixed(1)}% of those with preference)</div>
    </>
  );
  
  // Determine colors based on who won
  const candidateColor = votesFor > votesAgainst ? '#FFD700' : '#C0C0C0'; // Gold for winner, Silver for loser
  const opponentColor = votesAgainst > votesFor ? '#FFD700' : '#C0C0C0';
  
  return (
    <Tooltip title={tooltipText} placement="top">
      <Box sx={{ width: '100%', cursor: 'pointer' }}>
        {/* First bar - Candidate */}
        <Box sx={{ mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                minWidth: 120,
                fontWeight: 600,
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {candidateName}
            </Typography>
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              height: 20, 
              borderRadius: 1, 
              overflow: 'hidden', 
              bgcolor: 'grey.200',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 1,
              }
            }}>
              <Box 
                sx={{ 
                  width: `${forPercentage}%`,
                  bgcolor: candidateColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: votesFor > votesAgainst ? 'rgba(0, 0, 0, 0.87)' : 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: votesFor > votesAgainst ? 'inset 0 1px 3px rgba(255, 255, 255, 0.5)' : 'none',
                }}
              >
                {forPercentage >= 10 && `${Math.round(forPercentage)}%`}
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Second bar - Opponent */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                minWidth: 120,
                fontWeight: 600,
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {opponentName}
            </Typography>
            <Box sx={{ 
              flex: 1,
              display: 'flex', 
              height: 20, 
              borderRadius: 1, 
              overflow: 'hidden', 
              bgcolor: 'grey.200',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 1,
              }
            }}>
              <Box 
                sx={{ 
                  width: `${againstPercentage}%`,
                  bgcolor: opponentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: votesAgainst > votesFor ? 'rgba(0, 0, 0, 0.87)' : 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  boxShadow: votesAgainst > votesFor ? 'inset 0 1px 3px rgba(255, 255, 255, 0.5)' : 'none',
                }}
              >
                {againstPercentage >= 10 && `${Math.round(againstPercentage)}%`}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};

const HeadToHeadTable = ({ results, winnerColor }) => {
  const theme = useTheme();
  
  // Calculate support for candidates in head-to-head matchup (same as WinnerExplanation)
  const calculateVotes = (candidateA, candidateB) => {
    let aVotes = 0;
    let bVotes = 0;
    
    if (!results.ballot_types) return { aVotes, bVotes };
    
    results.ballot_types.forEach(ballotType => {
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
          aVotes += count;
        } else if (posB < posA) {
          bVotes += count;
        }
        // If posA === posB, they're tied in this ranking
      } else if (posA !== -1 && posB === -1) {
        // Only A is ranked, A wins
        aVotes += count;
      } else if (posA === -1 && posB !== -1) {
        // Only B is ranked, B wins
        bVotes += count;
      }
      // If neither is ranked, neither gets votes from this ballot type
    });
    
    return { aVotes, bVotes };
  };
  
  // Process head-to-head data
  const processHeadToHeadData = () => {
    if (!results || !results.candidates || results.candidates.length === 0) {
      return [];
    }
    
    const candidateData = [];
    const candidates = results.candidates;
    const winnerNames = results.is_tie ? (results.tied_winners || []) : [results.determined_winner].filter(w => w);
    
    // Process each candidate
    candidates.forEach((candidate) => {
      const candidateName = typeof candidate === 'string' ? candidate : candidate.name;
      if (!candidateName) return;
      
      const allComparisons = [];
      
      // Compare with each other candidate
      candidates.forEach((opponent) => {
        const opponentName = typeof opponent === 'string' ? opponent : opponent.name;
        if (!opponentName || candidateName === opponentName) return; // Skip self
        
        const { aVotes: votesFor, bVotes: votesAgainst } = calculateVotes(candidateName, opponentName);
        
        let result;
        if (votesFor > votesAgainst) {
          result = 'win';
        } else if (votesFor === votesAgainst) {
          result = 'tie';
        } else {
          result = 'loss';
        }
        
        allComparisons.push({ 
          opponent: opponentName, 
          votesFor, 
          votesAgainst, 
          result,
          margin: votesFor - votesAgainst
        });
      });
      
      // Sort comparisons: wins first (by margin), then ties, then losses (by margin)
      allComparisons.sort((a, b) => {
        // First sort by result type
        const resultOrder = { win: 0, tie: 1, loss: 2 };
        if (resultOrder[a.result] !== resultOrder[b.result]) {
          return resultOrder[a.result] - resultOrder[b.result];
        }
        // Within same result type, sort by margin (descending for wins, ascending for losses)
        if (a.result === 'win') {
          return b.margin - a.margin; // Bigger wins first
        } else if (a.result === 'loss') {
          return b.margin - a.margin; // Smaller losses first (closer to zero)
        }
        return 0; // Ties are all equal
      });
      
      // Count wins, ties, losses
      const wins = allComparisons.filter(c => c.result === 'win').length;
      const ties = allComparisons.filter(c => c.result === 'tie').length;
      const losses = allComparisons.filter(c => c.result === 'loss').length;
      
      candidateData.push({
        candidate: candidateName,
        isWinner: winnerNames.includes(candidateName),
        comparisons: allComparisons,
        wins,
        ties,
        losses,
      });
    });
    
    // Sort by number of wins (most wins first), then by ties, then alphabetically
    candidateData.sort((a, b) => {
      // First sort by number of wins
      if (a.wins !== b.wins) {
        return b.wins - a.wins; // Descending order
      }
      // If same number of wins, sort by number of ties
      if (a.ties !== b.ties) {
        return b.ties - a.ties; // Descending order
      }
      // If same wins and ties, sort alphabetically
      return a.candidate.localeCompare(b.candidate);
    });
    
    return candidateData;
  };
  
  const matchupData = processHeadToHeadData();
  
  // Check if there are any ties across all candidates
  const hasTiesInResults = matchupData.some(candidate => candidate.ties > 0);
  
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
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom align="center">
          One-on-One Comparisons
        </Typography>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#FFD700', borderRadius: 0.5, boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.5)' }} />
            <Typography variant="caption" color="text.secondary">Winner</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: '#C0C0C0', borderRadius: 0.5 }} />
            <Typography variant="caption" color="text.secondary">Loser</Typography>
          </Box>
        </Box>
        
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
            <TableBody>
              {matchupData.length === 0 ? (
                <TableRow>
                  <TableCell align="center" sx={{ py: 2, color: 'text.secondary' }}>
                    <Typography variant="body2">No comparison data available</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                matchupData.map((candidateData, index) => (
                  <React.Fragment key={candidateData.candidate}>
                    {/* Candidate header */}
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          backgroundColor: candidateData.isWinner ? alpha(winnerColor, 0.1) : 'background.default',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          py: 1,
                          borderBottom: 'none',
                        }}
                      >
                        {candidateData.candidate.length > 25 ? (
                          <Tooltip title={candidateData.candidate} placement="left">
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: candidateData.isWinner ? 700 : 600,
                                  color: candidateData.isWinner ? winnerColor : 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '250px',
                                }}
                              >
                                {candidateData.candidate}'s comparisons
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {candidateData.wins} {candidateData.wins === 1 ? 'win' : 'wins'}{hasTiesInResults ? `, ${candidateData.ties} ${candidateData.ties === 1 ? 'tie' : 'ties'}` : ''}, {candidateData.losses} {candidateData.losses === 1 ? 'loss' : 'losses'}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: candidateData.isWinner ? 700 : 600,
                                color: candidateData.isWinner ? winnerColor : 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '250px',
                              }}
                            >
                              {candidateData.candidate}'s comparisons
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {candidateData.wins} {candidateData.wins === 1 ? 'win' : 'wins'}{hasTiesInResults ? `, ${candidateData.ties} ${candidateData.ties === 1 ? 'tie' : 'ties'}` : ''}, {candidateData.losses} {candidateData.losses === 1 ? 'loss' : 'losses'}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* All comparisons with two-bar visualization */}
                    {candidateData.comparisons.map((comparison, idx) => {
                      return (
                        <TableRow key={`${candidateData.candidate}-comparison-${idx}`}>
                          <TableCell 
                            sx={{ 
                              px: 4,
                              py: 0.75,
                              borderBottom: 'none',
                            }}
                          >
                            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                              <ComparisonBars 
                                votesFor={comparison.votesFor} 
                                votesAgainst={comparison.votesAgainst}
                                totalVoters={results.total_voters}
                                candidateName={candidateData.candidate}
                                opponentName={comparison.opponent}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* No comparisons message (shouldn't happen unless only one candidate) */}
                    {candidateData.comparisons.length === 0 && (
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            pl: 3,
                            borderBottom: 'none',
                            color: 'text.disabled',
                            fontStyle: 'italic',
                          }}
                        >
                          <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                              No comparisons available
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {/* Spacer between candidates */}
                    {index < matchupData.length - 1 && (
                      <TableRow>
                        <TableCell sx={{ py: 0.5, borderBottom: 'none' }} />
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default HeadToHeadTable;