import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import VoteComparison from '../shared/VoteComparison';
import { WINNER_TYPE_COLORS } from '../../constants/winnerColors';

/**
 * TiedWinners Component
 * 
 * Handles display when there are tied winners.
 * Shows expandable explanations for each candidate's claim to victory.
 */
const TiedWinners = ({ 
  results, 
  tiedWinners,
  winnerType,
  calculateVotes, 
  getBallotSupport,
  expandedMatchups,
  toggleMatchupDetails,
  ballotTypes,
  totalVoters,
  candidates,
  candidateRecords
}) => {
  const theme = useTheme();
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [expandedMatchupsLocal, setExpandedMatchupsLocal] = useState(new Set());
  
  // Toggle expansion for a specific matchup
  const toggleMatchupDetailsLocal = (candidate, opponent) => {
    const key = `${candidate}-${opponent}`;
    setExpandedMatchupsLocal(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  // Color for tied winners (gray)
  const TIE_COLOR = WINNER_TYPE_COLORS.tied;
  
  // Get explanation text for ties
  const getTieExplanation = () => {
    const tiedList = tiedWinners.length === 2 
      ? `${tiedWinners[0]} and ${tiedWinners[1]}`
      : tiedWinners.slice(0, -1).join(', ') + ', and ' + tiedWinners[tiedWinners.length - 1];
    
    return (
      <>
        No candidate beats every other candidate head-to-head. 
        There is not a single candidate with no losses, the best win-loss record, 
        or the smallest largest loss. <strong>{tiedList}</strong> share the top position 
        with identical metrics.
      </>
    );
  };
  
  // Sort candidates by record
  const sortedRecords = candidateRecords
    .map(record => ({
      ...record,
      net_wins: record.wins - record.losses
    }))
    .sort((a, b) => {
      // First sort by net wins
      if (b.net_wins !== a.net_wins) return b.net_wins - a.net_wins;
      // Then by worst loss margin (less negative is better)
      return (a.worst_loss_margin || 0) - (b.worst_loss_margin || 0);
    });
  
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
          It's a tie!
        </Typography>
        
        {/* Explanation Box */}
        <Box sx={{ display: 'flex', justifyContent: 'center'}}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              maxWidth: 700,
              backgroundColor: alpha(TIE_COLOR, 0.05),
              border: '1px solid',
              borderColor: alpha(TIE_COLOR, 0.2),
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ lineHeight: 1.7, textAlign: 'left' }}
            >
              {getTieExplanation()}
            </Typography>
          </Paper>
        </Box>
      </Box>
      
      {/* Candidates List */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1200 }}>
          {sortedRecords.map((record) => {
            const isTiedWinner = tiedWinners.includes(record.candidate);
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
                  border: isTiedWinner ? `2px solid ${TIE_COLOR}` : '1px solid',
                  borderColor: isTiedWinner ? TIE_COLOR : 'divider',
                  backgroundColor: isTiedWinner ? alpha(TIE_COLOR, 0.05) : 'background.paper',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ fontWeight: isTiedWinner ? 600 : 400 }}>
                        {record.candidate}
                      </Typography>
                      {isTiedWinner && (
                        <Chip 
                          label="Tied Winner" 
                          size="small" 
                          sx={{ 
                            backgroundColor: TIE_COLOR,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    <Box display="flex" gap={2} mr={2} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {record.wins}-{record.losses} record
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Largest loss: {record.worst_loss_margin || 0} {(record.worst_loss_margin || 0) === 1 ? 'vote' : 'votes'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <MatchupDetails 
                    candidate={record.candidate}
                    wins={wins}
                    losses={losses}
                    ties={ties}
                    isTiedWinner={isTiedWinner}
                    toggleMatchupDetails={toggleMatchupDetailsLocal}
                    expandedMatchups={expandedMatchupsLocal}
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
 * MatchupDetails - Shows details about wins, losses, and ties
 */
const MatchupDetails = ({ 
  candidate,
  wins, 
  losses, 
  ties, 
  isTiedWinner,
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
          <Grid container spacing={2}>
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
                      Margin: +{win.margin} {win.margin === 1 ? 'vote' : 'votes'}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => toggleMatchupDetails(candidate, win.opponent)}
                      sx={{ mt: 1 }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2 }}>
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
                              colorA={WINNER_TYPE_COLORS.win}
                              colorB={WINNER_TYPE_COLORS.loss}
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
          <Grid container spacing={2}>
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
                      Margin: -{Math.abs(loss.margin)} {Math.abs(loss.margin) === 1 ? 'vote' : 'votes'}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => toggleMatchupDetails(candidate, loss.opponent)}
                      sx={{ mt: 1 }}
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2 }}>
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
                              colorA={WINNER_TYPE_COLORS.loss}
                              colorB={WINNER_TYPE_COLORS.win}
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
          <Grid container spacing={2}>
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
                      <Box sx={{ mt: 2 }}>
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
                              colorA={WINNER_TYPE_COLORS.win}
                              colorB={WINNER_TYPE_COLORS.loss}
                              animate={false}
                              ballotSupport={supportData}
                              ballotTypes={ballotTypes}
                              isTied={true}
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

export default TiedWinners;