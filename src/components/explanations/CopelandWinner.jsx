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
 * CopelandWinner Component
 * 
 * Handles display when winner is determined by Copeland method (best win-loss record).
 * Shows win-loss records and explains why this candidate has the best record.
 * ~300 lines focused on this scenario.
 */
const CopelandWinner = ({ 
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
  })).sort((a, b) => b.net_wins - a.net_wins);
  
  // Get the winner's record
  const winnerRecord = recordsArray.find(r => r.candidate === winner);
  
  // Determine the scenario for the explanation
  const candidatesWithNoLosses = candidateRecords.filter(r => r.losses === 0);
  const everyoneHasLosses = candidateRecords.every(r => r.losses > 0);
  
  const getExplanationText = () => {
    if (candidatesWithNoLosses.length > 1) {
      return "Since no candidate beats all others head-to-head and multiple candidates have no losses";
    } else if (everyoneHasLosses) {
      return "Since every candidate has at least one loss";
    } else {
      return "Since no candidate beats all others head-to-head";
    }
  };
  
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
          Winner determined by best win-loss record
        </Typography>
        
        {/* Explanation Box */}
        <Box sx={{ display: 'flex', justifyContent: 'center', textAlign: 'left' }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              maxWidth: 700,
              backgroundColor: alpha(WINNER_TYPE_COLORS.copeland, 0.05),
              border: '1px solid',
              borderColor: alpha(WINNER_TYPE_COLORS.copeland, 0.2),
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ lineHeight: 1.7 }}
            >
              {getExplanationText()}, the winner is determined by who has the best 
              win-loss record. <strong>{winner}</strong> has <strong>{winnerRecord.wins}</strong> {winnerRecord.wins === 1 ? 'win' : 'wins'}
              {winnerRecord.ties > 0 && (
                <>, <strong>{winnerRecord.ties}</strong> {winnerRecord.ties === 1 ? 'tie' : 'ties'}</>
              )}
              {winnerRecord.losses === 0 ? (
                <> and <strong>no losses</strong></>
              ) : (
                <> and <strong>{winnerRecord.losses}</strong> {winnerRecord.losses === 1 ? 'loss' : 'losses'}</>
              )}, giving a net score of{' '}
              <strong>{winnerRecord.net_wins > 0 ? '+' : ''}{winnerRecord.net_wins}</strong>, 
              which is the best among all candidates.
            </Typography>
          </Paper>
        </Box>
      </Box>
      
      {/* Win-Loss Records */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          {recordsArray.map((record) => {
            const isWinner = record.candidate === winner;
            const losses = record.opponents.filter(o => o.result === 'loss');
            const wins = record.opponents.filter(o => o.result === 'win');
            const ties = record.opponents.filter(o => o.result === 'tie');
            
            return (
              <Accordion 
                key={record.candidate}
                expanded={expandedCandidate === record.candidate}
                onChange={() => setExpandedCandidate(
                  expandedCandidate === record.candidate ? null : record.candidate
                )}
                sx={{
                  mb: 2,
                  border: isWinner ? `2px solid ${WINNER_TYPE_COLORS.copeland}` : '1px solid',
                  borderColor: isWinner ? WINNER_TYPE_COLORS.copeland : 'divider',
                  backgroundColor: isWinner ? alpha(WINNER_TYPE_COLORS.copeland, 0.05) : 'background.paper',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                    <Typography variant="h6" sx={{ fontWeight: isWinner ? 600 : 400 }}>
                      {record.candidate}
                      {isWinner && (
                        <Chip 
                          label="Winner" 
                          size="small" 
                          sx={{ 
                            ml: 2,
                            backgroundColor: WINNER_TYPE_COLORS.copeland,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Typography>
                    <RecordSummary record={record} />
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
 * RecordSummary - Shows win/loss/tie counts
 */
const RecordSummary = ({ record }) => {
  return (
    <Box display="flex" gap={2} mr={2}>
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
    </Box>
  );
};

/**
 * MatchupDetails - Shows details about wins, losses, and ties
 * 
 * Color logic:
 * - Wins: Current candidate gets green, opponent gets red
 * - Losses: Current candidate gets red, opponent gets green  
 * - Ties: If overall winner is involved, they get green; otherwise first candidate gets green
 */
const MatchupDetails = ({ 
  candidate,
  wins, 
  losses, 
  ties, 
  isWinner,
  winner,
  toggleMatchupDetails,
  expandedMatchups,
  calculateVotes,
  getBallotSupport,
  ballotTypes,
  totalVoters
}) => {
  return (
    <Box sx={{ p: 3 }}>
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
              
              return (
                <Grid item xs={12} key={loss.opponent}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: alpha(WINNER_TYPE_COLORS.loss, 0.3),
                      backgroundColor: alpha(WINNER_TYPE_COLORS.loss, 0.05),
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {loss.opponent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Margin: -{Math.abs(loss.margin)} votes
                    </Typography>
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
      
      {/* Special note for winner */}
      {isWinner && (
        <Box 
          mt={2} 
          p={2} 
          sx={{ 
            backgroundColor: alpha(WINNER_TYPE_COLORS.copeland, 0.1), 
            borderRadius: 1,
            border: '1px solid',
            borderColor: alpha(WINNER_TYPE_COLORS.copeland, 0.5),
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            This candidate has the best win-loss record among all candidates.
          </Typography>
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

export default CopelandWinner;