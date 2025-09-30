import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Paper,
  Button,
  Collapse,
  alpha,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { WINNER_TYPE_COLORS } from '../../constants/winnerColors';
import VoteComparison from '../shared/VoteComparison';

/**
 * MinimaxWinner Component
 * 
 * Handles display when winner is determined by having the smallest largest loss.
 * This occurs when multiple candidates have the same best win-loss record,
 * and the winner is chosen by having the smallest worst defeat.
 */
const MinimaxWinner = ({ 
  results,
  winner,
  candidateRecords,
  calculateVotes,
  getBallotSupport,
  ballotTypes,
  totalVoters
}) => {
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [expandedMatchups, setExpandedMatchups] = useState(new Set());
  
  // Toggle expansion for a specific matchup
  const toggleMatchupDetails = (candidate, opponent) => {
    const key = `${candidate}-${opponent}`;
    setExpandedMatchups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  // Add net_wins calculation to each record
  const recordsArray = candidateRecords.map(record => ({
    ...record,
    net_wins: record.wins - record.losses
  })).sort((a, b) => {
    // First sort by net wins
    if (b.net_wins !== a.net_wins) return b.net_wins - a.net_wins;
    // Then by minimax score (higher is better, less negative)
    return (b.minimax_score || -Infinity) - (a.minimax_score || -Infinity);
  });
  
  // Get the winner's record
  const winnerRecord = recordsArray.find(r => r.candidate === winner);
  
  // Find all candidates with the best win-loss record
  const bestNetWins = recordsArray[0].net_wins;
  const topTiedCandidates = recordsArray.filter(r => r.net_wins === bestNetWins);
  
  // Color for smallest largest loss winner (purple)
  const MINIMAX_COLOR = WINNER_TYPE_COLORS.minimax;
  
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
            mb: 2,
          }}
        >
          Winner determined by comparing the size of the largest loss of each candidate
        </Typography>
        
        {/* Explanation Box */}
        <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              maxWidth: 700,
              backgroundColor: alpha(MINIMAX_COLOR, 0.05),
              border: '1px solid',
              borderColor: alpha(MINIMAX_COLOR, 0.2),
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ lineHeight: 1.7, textAlign: 'left' }}
            >
              {topTiedCandidates.length} candidates have the same best win-loss record 
              ({topTiedCandidates[0].wins} {topTiedCandidates[0].wins === 1 ? 'win' : 'wins'},{' '} 
              {topTiedCandidates[0].losses} {topTiedCandidates[0].losses === 1 ? 'loss' : 'losses'}). 
              Among these tied candidates, <strong>{winner}</strong> has the smallest worst loss, 
              losing by at most <strong>{Math.abs(winnerRecord.minimax_score)}</strong> votes in their worst defeat.
            </Typography>
          </Paper>
        </Box>
      </Box>
      
      {/* Win-Loss Records */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          {recordsArray.map((record) => {
            const isWinner = record.candidate === winner;
            const isTopTied = record.net_wins === bestNetWins;
            const losses = record.opponents.filter(o => o.result === 'loss');
            const wins = record.opponents.filter(o => o.result === 'win');
            const ties = record.opponents.filter(o => o.result === 'tie');
            
            // Find all worst losses for this candidate (there might be multiple with same margin)
            const worstLossMargin = losses.length > 0 ? 
              Math.max(...losses.map(loss => Math.abs(loss.margin))) : 0;
            const worstLosses = losses.filter(loss => Math.abs(loss.margin) === worstLossMargin);
            
            return (
              <Accordion 
                key={record.candidate}
                expanded={expandedCandidate === record.candidate}
                onChange={() => setExpandedCandidate(
                  expandedCandidate === record.candidate ? null : record.candidate
                )}
                sx={{
                  mb: 2,
                  border: isWinner ? `2px solid ${MINIMAX_COLOR}` : 
                          isTopTied ? '2px dashed' : '1px solid',
                  borderColor: isWinner ? MINIMAX_COLOR : 
                               isTopTied ? alpha(MINIMAX_COLOR, 0.5) : 'divider',
                  backgroundColor: isWinner ? alpha(MINIMAX_COLOR, 0.05) : 
                                   isTopTied ? alpha(MINIMAX_COLOR, 0.02) : 'background.paper',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ fontWeight: isWinner ? 600 : 400 }}>
                        {record.candidate}
                      </Typography>
                      {isWinner && (
                        <Chip 
                          label="Winner" 
                          size="small" 
                          sx={{ 
                            backgroundColor: MINIMAX_COLOR,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {!isWinner && isTopTied && (
                        <Chip 
                          label="Tied on record" 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderColor: MINIMAX_COLOR,
                            color: MINIMAX_COLOR,
                          }}
                        />
                      )}
                    </Box>
                    <RecordSummary record={record} isTopTied={isTopTied} />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <MatchupDetails 
                    candidate={record.candidate}
                    wins={wins}
                    losses={losses}
                    ties={ties}
                    isWinner={isWinner}
                    winner={winner}
                    worstLosses={worstLosses}
                    minimaxScore={record.minimax_score}
                    toggleMatchupDetails={toggleMatchupDetails}
                    expandedMatchups={expandedMatchups}
                    calculateVotes={calculateVotes}
                    getBallotSupport={getBallotSupport}
                    ballotTypes={ballotTypes}
                    totalVoters={totalVoters}
                  />
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

/**
 * RecordSummary - Shows win/loss/tie counts and minimax score
 */
const RecordSummary = ({ record, isTopTied }) => {
  return (
    <Box display="flex" gap={2} mr={2} alignItems="center">
      <Chip 
        label={`${record.wins} ${record.wins === 1 ? 'win' : 'wins'}`} 
        size="small"
        sx={{ backgroundColor: alpha(WINNER_TYPE_COLORS.win, 0.2) }}
      />
      <Chip 
        label={`${record.losses} ${record.losses === 1 ? 'loss' : 'losses'}`} 
        size="small"
        sx={{ backgroundColor: alpha(WINNER_TYPE_COLORS.loss, 0.2) }}
      />
      {record.ties > 0 && (
        <Chip 
          label={`${record.ties} ${record.ties === 1 ? 'tie' : 'ties'}`} 
          size="small"
          sx={{ backgroundColor: alpha(WINNER_TYPE_COLORS.tied, 0.2) }}
        />
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 600,
          color: record.net_wins > 0 ? WINNER_TYPE_COLORS.win : 
                 record.net_wins < 0 ? WINNER_TYPE_COLORS.loss : 'text.primary'
        }}
      >
        Net: {record.net_wins > 0 ? '+' : ''}{record.net_wins}
      </Typography>
      {isTopTied && record.minimax_score != null && (
        <Chip 
          label={`Largest loss: ${Math.abs(record.minimax_score)} ${Math.abs(record.minimax_score) === 1 ? 'vote' : 'votes'}`} 
          size="small"
          sx={{ 
            backgroundColor: alpha(WINNER_TYPE_COLORS.minimax, 0.2),
            ml: 1,
            fontWeight: 600,
          }}
        />
      )}
    </Box>
  );
};

/**
 * MatchupDetails - Shows details about wins, losses, and ties
 */
const MatchupDetails = ({ 
  candidate,
  wins, 
  losses, 
  ties, 
  isWinner,
  winner,
  worstLosses,
  minimaxScore,
  toggleMatchupDetails,
  expandedMatchups,
  calculateVotes,
  getBallotSupport,
  ballotTypes,
  totalVoters
}) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Explanation for winner */}
      {isWinner && (
        <Box 
          mb={3} 
          p={2} 
          sx={{ 
            backgroundColor: alpha(WINNER_TYPE_COLORS.minimax, 0.1), 
            borderRadius: 1,
            border: '1px solid',
            borderColor: alpha(WINNER_TYPE_COLORS.minimax, 0.5),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Smallest largest loss: <strong>{Math.abs(minimaxScore)} votes</strong> (best among tied candidates)
          </Typography>
          {worstLosses.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Worst {worstLosses.length === 1 ? 'defeat is' : 'defeats are'} to{' '}
              {worstLosses.map((loss, idx) => (
                <span key={loss.opponent}>
                  {idx > 0 && (idx === worstLosses.length - 1 ? ' and ' : ', ')}
                  <strong>{loss.opponent}</strong>
                </span>
              ))} by {Math.abs(worstLosses[0].margin)} votes.
              This is the smallest worst defeat among all candidates with the same win-loss record.
            </Typography>
          )}
        </Box>
      )}
      
      {/* Wins Section */}
      {wins.length > 0 && (
        <Box mb={3}>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ color: WINNER_TYPE_COLORS.win, fontWeight: 600 }}
          >
            Wins against:
          </Typography>
          <Grid container spacing={2} sx={{ maxWidth: 1000, margin: '0 auto' }}>
            {wins.map((win) => {
              const matchupKey = `${candidate}-${win.opponent}`;
              const isExpanded = expandedMatchups.has(matchupKey);
              
              return (
                <Grid item xs={12} key={win.opponent}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: alpha(WINNER_TYPE_COLORS.win, 0.3),
                      backgroundColor: alpha(WINNER_TYPE_COLORS.win, 0.05),
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {win.opponent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margin: +{win.margin} votes
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => toggleMatchupDetails(candidate, win.opponent)}
                      sx={{ mt: 1 }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, mx: 'auto', maxWidth: 900 }}>
                        {(() => {
                          const { winnerVotes, opponentVotes } = calculateVotes(candidate, win.opponent);
                          const supportData = getBallotSupport(candidate, win.opponent);
                          return (
                            <VoteComparison
                              candidateA={candidate}
                              candidateB={win.opponent}
                              votesA={winnerVotes}
                              votesB={opponentVotes}
                              totalVoters={totalVoters}
                              overallWinner={winner}
                              animate={false}
                              ballotSupport={supportData}
                              ballotTypes={ballotTypes}
                            />
                          );
                        })()}
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      
      {/* Losses Section */}
      {losses.length > 0 && (
        <Box mb={3}>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ color: WINNER_TYPE_COLORS.loss, fontWeight: 600 }}
          >
            Loses to:
          </Typography>
          <Grid container spacing={2} sx={{ maxWidth: 1000, margin: '0 auto' }}>
            {losses.map((loss) => {
              const matchupKey = `${candidate}-${loss.opponent}`;
              const isExpanded = expandedMatchups.has(matchupKey);
              const isWorstLoss = worstLosses.some(wl => wl.opponent === loss.opponent);
              
              return (
                <Grid item xs={12} key={loss.opponent}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      border: isWorstLoss ? '2px solid' : '1px solid',
                      borderColor: isWorstLoss ? WINNER_TYPE_COLORS.loss : alpha(WINNER_TYPE_COLORS.loss, 0.3),
                      backgroundColor: alpha(WINNER_TYPE_COLORS.loss, isWorstLoss ? 0.1 : 0.05),
                    }}
                  >
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {loss.opponent}
                        </Typography>
                        {isWorstLoss && (
                          <Chip 
                            label="Worst Loss" 
                            size="small" 
                            sx={{ 
                              backgroundColor: WINNER_TYPE_COLORS.loss,
                              color: 'white',
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Margin: -{Math.abs(loss.margin)} votes
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => toggleMatchupDetails(candidate, loss.opponent)}
                      sx={{ mt: 1 }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, mx: 'auto', maxWidth: 900 }}>
                        {(() => {
                          const { winnerVotes, opponentVotes } = calculateVotes(candidate, loss.opponent);
                          const supportData = getBallotSupport(candidate, loss.opponent);
                          return (
                            <VoteComparison
                              candidateA={candidate}
                              candidateB={loss.opponent}
                              votesA={winnerVotes}
                              votesB={opponentVotes}
                              totalVoters={totalVoters}
                              overallWinner={winner}
                              animate={false}
                              ballotSupport={supportData}
                              ballotTypes={ballotTypes}
                            />
                          );
                        })()}
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      
      {/* Ties Section */}
      {ties.length > 0 && (
        <Box>
          <Typography 
            variant="subtitle2" 
            gutterBottom 
            sx={{ color: WINNER_TYPE_COLORS.tied, fontWeight: 600 }}
          >
            Ties with:
          </Typography>
          <Grid container spacing={2} sx={{ maxWidth: 1000, margin: '0 auto' }}>
            {ties.map((tie) => {
              const matchupKey = `${candidate}-${tie.opponent}`;
              const isExpanded = expandedMatchups.has(matchupKey);
              
              return (
                <Grid item xs={12} key={tie.opponent}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: alpha(WINNER_TYPE_COLORS.tied, 0.5),
                      backgroundColor: alpha(WINNER_TYPE_COLORS.tied, 0.05),
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {tie.opponent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margin: 0 votes
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => toggleMatchupDetails(candidate, tie.opponent)}
                      sx={{ mt: 1 }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, mx: 'auto', maxWidth: 900 }}>
                        {(() => {
                          const { winnerVotes, opponentVotes } = calculateVotes(candidate, tie.opponent);
                          const supportData = getBallotSupport(candidate, tie.opponent);
                          return (
                            <VoteComparison
                              candidateA={candidate}
                              candidateB={tie.opponent}
                              votesA={winnerVotes}
                              votesB={opponentVotes}
                              totalVoters={totalVoters}
                              overallWinner={winner}
                              animate={false}
                              ballotSupport={supportData}
                              ballotTypes={ballotTypes}
                            />
                          );
                        })()}
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      
      {/* No matchups case */}
      {wins.length === 0 && losses.length === 0 && ties.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No head-to-head matchup data available.
        </Typography>
      )}
    </Box>
  );
};

export default MinimaxWinner;