import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Handshake as HandshakeIcon,
  BallotOutlined as BallotIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import HeadToHeadTable from './HeadToHeadTable';
import PairwiseBallotViewer from './PairwiseBallotViewer';
import ShareDialog from './ShareDialog';

/**
 * Reusable Results Display Component
 * Used by both PollResults and Demo pages
 */
const ResultsDisplay = ({
  results,
  poll,
  pollId,
  showExportButtons = false,
  showShareButton = false,
  onDownloadPDF = null,
  onDownloadCSV = null,
  shareUrl = null,
  CustomBallotViewer = null, // Custom ballot viewer component (for demo)
  customBallotViewerProps = {}, // Props for custom ballot viewer
}) => {
  const theme = useTheme();
  const [ballotViewerOpen, setBallotViewerOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Check if there are no votes
  if (!results.statistics || results.statistics.total_votes === 0) {
    return (
      <Box sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            No votes yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Waiting for participants to submit their ballots...
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Determine winner type and colors
  const winnerType = results.winner_type;
  const hasTie = winnerType === 'tie';
  const winner = results.winner;
  const tiedWinners = results.winners || [];
  
  const getWinnerColor = () => {
    switch (winnerType) {
      case 'condorcet': return theme.palette.success.main;
      case 'most_wins': return theme.palette.info.main;
      case 'smallest_loss': return theme.palette.warning.main;
      case 'tie': return theme.palette.grey[600];
      default: return theme.palette.grey[500];
    }
  };
  
  const getWinnerExplanation = () => {
    switch (winnerType) {
      case 'condorcet':
        return 'Beats every other candidate head-to-head';
      case 'most_wins':
        return 'Has the best win-loss record';
      case 'smallest_loss':
        return 'Has the smallest loss among all candidates with the most wins';
      case 'tie':
        return 'There is a tie in the head-to-head comparisons';
      default:
        return '';
    }
  };
  
  const getDetailedMatchupInfo = () => {
    if (!results.pairwise_matrix) return null;
    
    const winnerNames = tiedWinners.length > 0 ? tiedWinners : (winner ? [winner] : []);
    const pairwiseMatrix = results.pairwise_matrix;
    
    const matchupDetails = [];
    
    winnerNames.forEach(winnerName => {
      const matchups = pairwiseMatrix[winnerName] || {};
      const victories = [];
      const losses = [];
      const ties = [];
      
      Object.entries(matchups).forEach(([opponent, margin]) => {
        if (margin > 0) {
          victories.push({ opponent, margin });
        } else if (margin < 0) {
          losses.push({ opponent, margin: Math.abs(margin) });
        } else if (margin === 0 && opponent !== winnerName) {
          ties.push({ opponent });
        }
      });
      
      victories.sort((a, b) => b.margin - a.margin);
      losses.sort((a, b) => b.margin - a.margin);
      
      matchupDetails.push({
        candidate: winnerName,
        victories,
        losses,
        ties
      });
    });
    
    return matchupDetails;
  };
  
  const matchupDetails = getDetailedMatchupInfo();

  return (
    <Box>
      {/* Export/Share Buttons Row */}
      {(showExportButtons || showShareButton) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Stack direction="row" spacing={2}>
            {showExportButtons && onDownloadCSV && onDownloadPDF && (
              <Box sx={{ 
                display: 'flex',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                <Button
                  variant="text"
                  startIcon={<CsvIcon />}
                  onClick={onDownloadCSV}
                  sx={{
                    px: 2,
                    borderRadius: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    color: 'text.primary',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    minWidth: 120
                  }}
                >
                  Export CSV
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<PdfIcon />}
                  onClick={onDownloadPDF}
                  sx={{
                    px: 2,
                    borderRadius: 0,
                    color: 'text.secondary',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    minWidth: 120
                  }}
                >
                  Export PDF
                </Button>
              </Box>
            )}
            
            {showShareButton && shareUrl && (
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => setShareDialogOpen(true)}
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                Share
              </Button>
            )}
          </Stack>
        </Box>
      )}

      {/* Winner Hero Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 4,
          p: { xs: 3, sm: 4 },
          background: `linear-gradient(135deg, ${alpha(getWinnerColor(), 0.08)} 0%, ${alpha(getWinnerColor(), 0.03)} 100%)`,
          border: `2px solid ${getWinnerColor()}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ 
          display: { xs: 'block', md: 'flex' },
          alignItems: 'center',
          gap: 3,
          textAlign: { xs: 'center', md: 'left' }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', md: 'flex-start' },
            mb: { xs: 2, md: 0 }
          }}>
            {hasTie ? (
              <HandshakeIcon sx={{ fontSize: { xs: 50, sm: 60, md: 70 }, color: getWinnerColor() }} />
            ) : (
              <TrophyIcon sx={{ fontSize: { xs: 50, sm: 60, md: 70 }, color: getWinnerColor() }} />
            )}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                color: getWinnerColor(),
                fontWeight: 600,
                letterSpacing: 1.5,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {hasTie ? 'Consensus Choice Winners' : 'Consensus Choice Winner'}
            </Typography>
            
            {hasTie ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {tiedWinners.map((name) => (
                  <Typography 
                    key={name}
                    variant="h3" 
                    color={getWinnerColor()} 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                      lineHeight: 1.1
                    }}
                  >
                    {name}
                  </Typography>
                ))}
              </Box>
            ) : (
              <Typography 
                variant="h3" 
                color={getWinnerColor()} 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                  lineHeight: 1.1,
                  mb: 1
                }}
              >
                {winner || 'No Clear Winner'}
              </Typography>
            )}
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                maxWidth: { md: '600px' }
              }}
            >
              {getWinnerExplanation()}
            </Typography>
          </Box>
          
          {/* View Ballots Button - Desktop Only */}
          {(pollId || CustomBallotViewer) && (
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Button
                variant="outlined"
                startIcon={<BallotIcon />}
                onClick={() => setBallotViewerOpen(true)}
                size="large"
                sx={{ whiteSpace: 'nowrap' }}
              >
                View Ballots
              </Button>
            </Box>
          )}
        </Box>
        
        {/* View Ballots Button - Mobile Only */}
        {(pollId || CustomBallotViewer) && (
          <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<BallotIcon />}
              onClick={() => setBallotViewerOpen(true)}
              fullWidth
              sx={{ maxWidth: 300, mx: 'auto' }}
            >
              View Ballots
            </Button>
          </Box>
        )}
      </Paper>

      {/* Two Column Layout - Additional Details & Head-to-Head */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3,
        mb: 4
      }}>
        {/* Left Column: Additional Details */}
        <Box sx={{ order: { xs: 2, md: 1 } }}>
          {matchupDetails && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Additional Details
              </Typography>
              
              {/* CONDORCET WINNER */}
              {winnerType === 'condorcet' && matchupDetails.length === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {matchupDetails[0].candidate} is the only candidate that wins all of their head-to-head matchups.
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'grey.50', 
                    borderRadius: 1, 
                    p: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main', mb: 1, display: 'block' }}>
                      {matchupDetails[0].candidate.toUpperCase()}'S WINS
                    </Typography>
                    {matchupDetails[0].victories.map((v, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.75, pl: 1 }}>
                        • Beats {v.opponent} by {v.margin.toLocaleString()} votes
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* MOST WINS */}
              {winnerType === 'most_wins' && matchupDetails.length === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    No candidate beats all others head-to-head. {matchupDetails[0].candidate} has the highest score based on head-to-head matchups.
                  </Typography>
                  
                  {/* Scoring Explanation */}
                  <Box sx={{ 
                    bgcolor: 'grey.50', 
                    borderRadius: 1, 
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                      HOW THE SCORING WORKS
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Each candidate gets points based on their head-to-head matchups:<br/>
                      • Each win earns 1 point<br/>
                      • Each tie earns 0.5 points<br/>
                      • Each loss earns 0 points
                    </Typography>
                  </Box>

                  {/* Copeland Scores */}
                  {results.explanation?.copeland_scores && (() => {
                    const winnerColor = getWinnerColor();
                    const candidates = Object.keys(results.pairwise_matrix || {});
                    
                    const candidateRecords = {};
                    candidates.forEach(candidate => {
                      let wins = 0, losses = 0, ties = 0;
                      const matchups = results.pairwise_matrix[candidate] || {};
                      Object.entries(matchups).forEach(([opponent, margin]) => {
                        if (margin > 0) wins++;
                        else if (margin < 0) losses++;
                        else ties++;
                      });
                      candidateRecords[candidate] = { wins, losses, ties };
                    });
                    
                    return (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                          FINAL SCORES
                        </Typography>
                        {Object.entries(results.explanation.copeland_scores)
                          .sort(([,a], [,b]) => b - a)
                          .map(([candidate, score]) => {
                            const isWinner = candidate === matchupDetails[0].candidate;
                            const record = candidateRecords[candidate] || { wins: 0, losses: 0, ties: 0 };
                            const calculation = `${record.wins} ${record.wins === 1 ? 'win' : 'wins'}${record.ties > 0 ? ` + ${record.ties} ${record.ties === 1 ? 'tie' : 'ties'} × 0.5` : ''} = ${score} ${score === 1 ? 'point' : 'points'}`;
                            
                            return (
                              <Box 
                                key={candidate}
                                sx={{ 
                                  py: 0.75,
                                  px: 1.5,
                                  mb: 0.5,
                                  borderRadius: 0.5,
                                  bgcolor: isWinner ? alpha(winnerColor, 0.1) : 'transparent',
                                  border: isWinner ? `1px solid ${alpha(winnerColor, 0.3)}` : '1px solid transparent'
                                }}
                              >
                                <Box sx={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 0.25
                                }}>
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
                                      fontWeight: isWinner ? 600 : 500,
                                      color: isWinner ? winnerColor : 'text.primary'
                                    }}
                                  >
                                    {score} {score === 1 ? 'point' : 'points'}
                                  </Typography>
                                </Box>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontStyle: 'italic',
                                    display: 'block',
                                    pl: 1
                                  }}
                                >
                                  {calculation}
                                </Typography>
                              </Box>
                            );
                          })}
                      </Box>
                    );
                  })()}
                </Box>
              )}
              
              {/* SMALLEST LOSS */}
              {winnerType === 'smallest_loss' && matchupDetails.length === 1 && (
                <Box>
                  {results.explanation?.candidates_with_most_wins && (() => {
                    const tiedCandidates = results.explanation.candidates_with_most_wins;
                    const winnerColor = getWinnerColor();
                    let tiedText = '';
                    
                    if (tiedCandidates.length === 2) {
                      tiedText = `${tiedCandidates[0]} and ${tiedCandidates[1]} are tied for the most wins.`;
                    } else if (tiedCandidates.length > 2) {
                      const lastCandidate = tiedCandidates[tiedCandidates.length - 1];
                      const otherCandidates = tiedCandidates.slice(0, -1).join(', ');
                      tiedText = `${otherCandidates}, and ${lastCandidate} are tied for the most wins.`;
                    } else {
                      tiedText = `${matchupDetails[0].candidate} has the most wins.`;
                    }
                    
                    return (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {tiedText}
                        </Typography>
                        
                        {/* Scoring System */}
                        <Box sx={{ 
                          bgcolor: 'grey.50', 
                          borderRadius: 1, 
                          p: 2,
                          mb: 2,
                          border: '1px solid',
                          borderColor: 'grey.200'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                            HOW THE SCORING WORKS
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Each candidate gets points based on their head-to-head matchups:<br/>
                            • Each win earns 1 point<br/>
                            • Each tie earns 0.5 points<br/>
                            • Each loss earns 0 points
                          </Typography>
                        </Box>

                        {/* Copeland Scores with highlighting */}
                        {results.explanation?.copeland_scores && (() => {
                          const candidates = Object.keys(results.pairwise_matrix || {});
                          
                          const candidateRecords = {};
                          candidates.forEach(candidate => {
                            let wins = 0, losses = 0, ties = 0;
                            const matchups = results.pairwise_matrix[candidate] || {};
                            Object.entries(matchups).forEach(([opponent, margin]) => {
                              if (margin > 0) wins++;
                              else if (margin < 0) losses++;
                              else ties++;
                            });
                            candidateRecords[candidate] = { wins, losses, ties };
                          });
                          
                          return (
                            <Box sx={{ mb: 2.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                                FINAL SCORES
                              </Typography>
                              {Object.entries(results.explanation.copeland_scores)
                                .sort(([,a], [,b]) => b - a)
                                .map(([candidate, score]) => {
                                  const isTiedForMostWins = tiedCandidates.includes(candidate);
                                  const isWinner = candidate === matchupDetails[0].candidate;
                                  const record = candidateRecords[candidate] || { wins: 0, losses: 0, ties: 0 };
                                  const calculation = `${record.wins} ${record.wins === 1 ? 'win' : 'wins'}${record.ties > 0 ? ` + ${record.ties} ${record.ties === 1 ? 'tie' : 'ties'} × 0.5` : ''} = ${score} ${score === 1 ? 'point' : 'points'}`;
                                  
                                  return (
                                    <Box 
                                      key={candidate}
                                      sx={{ 
                                        py: 0.75,
                                        px: 1.5,
                                        mb: 0.5,
                                        borderRadius: 0.5,
                                        bgcolor: isWinner ? alpha(winnerColor, 0.1) : (isTiedForMostWins ? alpha(winnerColor, 0.05) : 'transparent'),
                                        border: isWinner ? `1px solid ${alpha(winnerColor, 0.3)}` : (isTiedForMostWins ? `1px solid ${alpha(winnerColor, 0.15)}` : '1px solid transparent')
                                      }}
                                    >
                                      <Box sx={{ 
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 0.25
                                      }}>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontWeight: isWinner ? 600 : (isTiedForMostWins ? 500 : 400),
                                            color: isWinner ? winnerColor : (isTiedForMostWins ? winnerColor : 'text.primary')
                                          }}
                                        >
                                          {candidate}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontWeight: isWinner ? 600 : (isTiedForMostWins ? 500 : 400),
                                            color: isWinner ? winnerColor : (isTiedForMostWins ? winnerColor : 'text.secondary')
                                          }}
                                        >
                                          {score} {score === 1 ? 'point' : 'points'}
                                        </Typography>
                                      </Box>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: 'text.secondary',
                                          fontStyle: 'italic',
                                          display: 'block',
                                          pl: 1
                                        }}
                                      >
                                        {calculation}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                            </Box>
                          );
                        })()}
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                          Among {tiedCandidates.length === 2 
                            ? `${tiedCandidates[0]} and ${tiedCandidates[1]}` 
                            : tiedCandidates.join(', ')}, {matchupDetails[0].candidate} has the smallest loss.
                        </Typography>
                      </>
                    );
                  })()}
                  
                  {/* Loss Comparisons */}
                  {results.explanation?.loss_sequences && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                        LOSS COMPARISONS
                      </Typography>
                      {Object.entries(results.explanation.loss_sequences)
                        .map(([candidate, losses]) => {
                          const isWinner = candidate === matchupDetails[0].candidate;
                          const winnerColor = getWinnerColor();
                          
                          const candidateMatchups = results.pairwise_matrix[candidate] || {};
                          const lossDetails = [];
                          Object.entries(candidateMatchups).forEach(([opponent, margin]) => {
                            if (margin < 0) {
                              lossDetails.push({ opponent, margin: Math.abs(margin) });
                            }
                          });
                          lossDetails.sort((a, b) => a.margin - b.margin);
                          
                          return (
                            <Box 
                              key={candidate}
                              sx={{ 
                                bgcolor: isWinner ? alpha(winnerColor, 0.08) : 'grey.50',
                                borderRadius: 1, 
                                p: 2,
                                mb: 1.5,
                                border: '1px solid',
                                borderColor: isWinner ? alpha(winnerColor, 0.2) : 'grey.200'
                              }}
                            >
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: isWinner ? 700 : 600, 
                                  color: isWinner ? winnerColor : 'error.main',
                                  mb: 1, 
                                  display: 'block' 
                                }}
                              >
                                {candidate.toUpperCase()}'S LOSSES (SMALLEST TO LARGEST)
                              </Typography>
                              {lossDetails.length > 0 ? (
                                lossDetails.map((loss, idx) => (
                                  <Typography 
                                    key={idx} 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      mb: 0.75, 
                                      pl: 1,
                                      fontWeight: isWinner && idx === 0 ? 600 : 400
                                    }}
                                  >
                                    • Loses to {loss.opponent} by {loss.margin.toLocaleString()} {loss.margin === 1 ? 'vote' : 'votes'}
                                  </Typography>
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                                  No losses
                                </Typography>
                              )}
                            </Box>
                          );
                        })}
                    </Box>
                  )}
                </Box>
              )}
              
              {/* TIE */}
              {winnerType === 'tie' && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    Multiple candidates have identical head-to-head records.
                  </Typography>
                  {matchupDetails.map((detail, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: getWinnerColor() }}>
                        {detail.candidate}
                      </Typography>
                      {detail.victories.length > 0 && (
                        <>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>Wins:</Typography>
                          {detail.victories.map((v, vidx) => (
                            <Typography key={vidx} variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 1 }}>
                              • Beats {v.opponent} by {v.margin.toLocaleString()}
                            </Typography>
                          ))}
                        </>
                      )}
                      {detail.losses.length > 0 && (
                        <>
                          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>Losses:</Typography>
                          {detail.losses.map((l, lidx) => (
                            <Typography key={lidx} variant="body2" color="text.secondary" sx={{ mb: 0.5, pl: 1 }}>
                              • Loses to {l.opponent} by {l.margin.toLocaleString()}
                            </Typography>
                          ))}
                        </>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Ballot Statistics */}
              {results.statistics && (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BarChartIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography 
                      variant="subtitle2" 
                      sx={{ fontWeight: 600, color: 'text.primary' }}
                    >
                      Ballot Statistics
                    </Typography>
                  </Box>
                  <Box sx={{ borderRadius: 1, p: 2.5 }}>
                    {/* Total Votes - Prominent */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2.5,
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <PeopleIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {results.statistics.total_votes.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Votes
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Ballot Types - Only 4 Statistics */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      BALLOT TYPES
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      {results.statistics.linear_orders !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 48, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {Math.round((results.statistics.linear_orders / results.statistics.total_votes) * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Linear orders
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {results.statistics.linear_orders.toLocaleString()} ballots
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {results.statistics.all_candidates_ranked !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 48, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                              {Math.round((results.statistics.all_candidates_ranked / results.statistics.total_votes) * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              All candidates ranked
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {results.statistics.all_candidates_ranked.toLocaleString()} ballots
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {results.statistics.bullet_votes !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 48, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                              {Math.round((results.statistics.bullet_votes / results.statistics.total_votes) * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Bullet votes
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {results.statistics.bullet_votes.toLocaleString()} ballots
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {results.statistics.has_skipped_ranks !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 48, 
                            height: 40, 
                            borderRadius: 1,
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {Math.round((results.statistics.has_skipped_ranks / results.statistics.total_votes) * 100)}%
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Skipped ranks
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {results.statistics.has_skipped_ranks.toLocaleString()} ballots
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                    
                    {/* Note about overlapping characteristics */}
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'block', 
                        mt: 2, 
                        fontStyle: 'italic',
                        textAlign: 'center'
                      }}
                    >
                      Note: Ballots can have multiple characteristics
                      <br />
                      (e.g., both linear order and all candidates ranked)
                    </Typography>
                    
                    {/* View Ballots button */}
                    {(pollId || CustomBallotViewer) && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<BallotIcon />}
                          onClick={() => setBallotViewerOpen(true)}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '&:hover': {
                              borderColor: 'text.secondary',
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          View Ballots
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>
        
        {/* Right Column: Head-to-Head Table */}
        <Box sx={{ order: { xs: 1, md: 2 } }}>
          <HeadToHeadTable results={results} winnerColor={getWinnerColor()} />
        </Box>
      </Box>

      {/* Pairwise Ballot Viewer Dialog */}
      {(pollId || CustomBallotViewer) && (
        CustomBallotViewer ? (
          <CustomBallotViewer
            isOpen={ballotViewerOpen}
            onClose={() => setBallotViewerOpen(false)}
            {...customBallotViewerProps}
          />
        ) : (
          <PairwiseBallotViewer
            pollId={pollId}
            isOpen={ballotViewerOpen}
            onClose={() => setBallotViewerOpen(false)}
          />
        )
      )}

      {/* Share Dialog */}
      {showShareButton && shareUrl && poll && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          poll={poll}
          shareUrl={shareUrl}
        />
      )}
    </Box>
  );
};

export default ResultsDisplay;