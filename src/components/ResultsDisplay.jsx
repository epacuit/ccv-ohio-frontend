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
import HeadToHeadTable from  './HeadToHeadTable'; // './HeadToHeadTableVersion2';
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
        return 'Wins all of their head-to-head matchups';
      case 'most_wins':
        return 'Has the best win-loss record';
      case 'smallest_loss':
        return 'Has the smallest loss';
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
        mb: 4,
        alignItems: 'start',
      }}>
        {/* Right Column: Additional Details */}
        <Box sx={{ order: { xs: 2, md: 2 } }}>
          {matchupDetails && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
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
              
              {/* Build full candidate records from pairwise matrix */}
              {(() => {
                if (!results.pairwise_matrix) return null;

                const candidates = Object.keys(results.pairwise_matrix);
                const winnerColor = getWinnerColor();
                const winnerNames = hasTie ? tiedWinners : (winner ? [winner] : []);

                // Build each candidate's record
                const candidateRecords = candidates.map(candidate => {
                  const matchups = results.pairwise_matrix[candidate] || {};
                  const wins = [];
                  const losses = [];
                  const ties = [];

                  Object.entries(matchups).forEach(([opponent, margin]) => {
                    if (margin > 0) wins.push({ opponent, margin });
                    else if (margin < 0) losses.push({ opponent, margin: Math.abs(margin) });
                    else ties.push({ opponent });
                  });

                  wins.sort((a, b) => b.margin - a.margin);
                  losses.sort((a, b) => a.margin - b.margin);

                  const smallestLoss = losses.length > 0 ? losses[0].margin : 0;

                  return { candidate, wins, losses, ties, smallestLoss };
                });

                // Sort: winners first, then by fewest losses, then smallest loss margin
                candidateRecords.sort((a, b) => {
                  const aIsWinner = winnerNames.includes(a.candidate) ? 0 : 1;
                  const bIsWinner = winnerNames.includes(b.candidate) ? 0 : 1;
                  if (aIsWinner !== bIsWinner) return aIsWinner - bIsWinner;
                  if (a.losses.length !== b.losses.length) return a.losses.length - b.losses.length;
                  return a.smallestLoss - b.smallestLoss;
                });

                return (
                  <Box>
                    {/* CONDORCET */}
                    {winnerType === 'condorcet' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        <strong>{winner}</strong> is the Consensus Choice winner: wins all of their head-to-head matchups.
                      </Typography>
                    )}

                    {/* NO CONDORCET - everyone has a loss (cycle) */}
                    {(winnerType === 'smallest_loss') && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        No candidate is preferred over all others. Every candidate has at least one loss.{' '}
                        <strong>{winner}</strong> wins with the smallest loss.
                      </Typography>
                    )}

                    {/* ONE CANDIDATE WITH 0 LOSSES (most wins, no losses) */}
                    {winnerType === 'most_wins' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        <strong>{winner}</strong> wins with no head-to-head losses.
                      </Typography>
                    )}

                    {/* TIE */}
                    {winnerType === 'tie' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {tiedWinners.join(' and ')} are tied with identical head-to-head records.
                      </Typography>
                    )}

                    {/* Candidate records */}
                    {candidateRecords.map((record) => {
                      const isWinner = winnerNames.includes(record.candidate);

                      return (
                        <Box
                          key={record.candidate}
                          sx={{
                            mb: 1.5,
                            p: 2,
                            borderRadius: 1,
                            bgcolor: isWinner ? alpha(winnerColor, 0.08) : 'grey.50',
                            border: '1px solid',
                            borderColor: isWinner ? alpha(winnerColor, 0.3) : 'grey.200',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              color: isWinner ? winnerColor : 'text.primary',
                            }}
                          >
                            {record.candidate}
                            {isWinner && winnerType !== 'tie' && (
                              <Typography component="span" variant="caption" sx={{ ml: 1, color: winnerColor, fontWeight: 400 }}>
                                — Winner
                              </Typography>
                            )}
                          </Typography>

                          {record.wins.length > 0 && (
                            <Box sx={{ mb: 0.5 }}>
                              {record.wins.map((w, idx) => (
                                <Typography key={idx} variant="body2" sx={{ mb: 0.25, pl: 1, color: 'success.dark' }}>
                                  Beats {w.opponent} by {w.margin.toLocaleString()}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          {record.losses.length > 0 && (
                            <Box sx={{ mb: 0.5 }}>
                              {record.losses.map((l, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{
                                    mb: 0.25,
                                    pl: 1,
                                    color: 'error.main',
                                    fontWeight: isWinner && idx === 0 && winnerType === 'smallest_loss' ? 600 : 400,
                                  }}
                                >
                                  Loses to {l.opponent} by {l.margin.toLocaleString()}
                                  {isWinner && idx === 0 && winnerType === 'smallest_loss' && (
                                    <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 400, fontStyle: 'italic' }}>
                                      (smallest loss)
                                    </Typography>
                                  )}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          {record.ties.length > 0 && (
                            <Box>
                              {record.ties.map((t, idx) => (
                                <Typography key={idx} variant="body2" sx={{ mb: 0.25, pl: 1, color: 'text.secondary' }}>
                                  Tied with {t.opponent}
                                </Typography>
                              ))}
                            </Box>
                          )}

                          {record.losses.length === 0 && record.wins.length > 0 && winnerType !== 'condorcet' && (
                            <Typography variant="caption" sx={{ pl: 1, color: 'success.main', fontStyle: 'italic' }}>
                              No losses
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()}
              
              {/* Total votes and View Ballots */}
              {results.statistics && (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        {results.statistics.total_votes.toLocaleString()} ballot{results.statistics.total_votes !== 1 ? 's' : ''} cast
                      </Typography>
                    </Box>
                    {(pollId || CustomBallotViewer) && (
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
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>
        
        {/* Left Column: Head-to-Head Table */}
        <Box sx={{ order: { xs: 1, md: 1 } }}>
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