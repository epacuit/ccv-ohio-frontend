import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Handshake as HandshakeIcon,
  Visibility as VisibilityIcon,
  BallotOutlined as BallotIcon,
} from '@mui/icons-material';
import API from '../services/api';
import PollDetails from '../components/PollDetails';
import HeadToHeadTable from '../components/HeadToHeadTable';
import PairwiseBallotViewer from '../components/PairwiseBallotViewer';

const PollResults = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [poll, setPoll] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ballotViewerOpen, setBallotViewerOpen] = useState(false);

  // Fetch poll details and results
  const fetchData = async () => {
    try {
      const [pollResponse, resultsResponse] = await Promise.all([
        API.get(`/polls/${pollId}`),
        API.get(`/results/${pollId}`)
      ]);
      
      setPoll(pollResponse.data);
      setResults(resultsResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 seconds if enabled
    const interval = autoRefresh ? setInterval(fetchData, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pollId, autoRefresh]);

  if (loading) {
    return (
      <Box sx={{ mt:'134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" action={
            <IconButton onClick={fetchData} size="small">
              <RefreshIcon />
            </IconButton>
          }>
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!results || !poll) {
    return null;
  }

  // Check if there are no votes
  if (!results.statistics || results.statistics.total_votes === 0) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {poll.title}
            </Typography>
            <PollDetails poll={poll} sx={{ mb: 4 }} />
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
        </Container>
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
        return 'Has the most head-to-head wins against other candidates';
      case 'smallest_loss':
        return 'Has the smallest loss against other candidates';
      case 'tie':
        return 'There is a tie in the one-on-one comparisons';
      default:
        return '';
    }
  };
  
  const getDetailedMatchupInfo = () => {
    if (!results.pairwise_matrix) return null;
    
    const winnerNames = tiedWinners.length > 0 ? tiedWinners : (winner ? [winner] : []);
    const pairwiseMatrix = results.pairwise_matrix;
    const candidates = Object.keys(pairwiseMatrix);
    
    // Build matchup details for winner(s)
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
      
      // Sort by margin (biggest first)
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
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header with View Ballots button */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" component="h1">
                {poll.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live Results Dashboard
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BallotIcon />}
              onClick={() => setBallotViewerOpen(true)}
              sx={{ mt: 1 }}
            >
              View Ballots
            </Button>
          </Box>

          {/* Poll Details */}
          <Box sx={{ mb: 4 }}>
            <PollDetails poll={poll} />
          </Box>

          {/* Winner Announcement and Matchup Table - Responsive Layout */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 3, 
            mb: 4, 
            alignItems: 'stretch' 
          }}>
            {/* Left: Winner Announcement */}
            <Box sx={{ 
              flex: { xs: '1 1 auto', lg: 1 },
              minWidth: 0 
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  background: alpha(getWinnerColor(), 0.05),
                  border: `2px solid ${getWinnerColor()}`,
                }}
              >
                <Box textAlign="center">
                  {/* Trophy Icon */}
                  <Box sx={{ mb: 2 }}>
                    {hasTie ? (
                      <HandshakeIcon sx={{ fontSize: 60, color: getWinnerColor() }} />
                    ) : (
                      <TrophyIcon sx={{ fontSize: 60, color: getWinnerColor() }} />
                    )}
                  </Box>
                  
                  {/* Title */}
                  <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                    {hasTie ? 'Consensus Choice Winners' : 'Consensus Choice Winner'}
                  </Typography>
                  
                  {/* Winner Name(s) - Most prominent */}
                  {hasTie ? (
                    <Box sx={{ mb: 3 }}>
                      {tiedWinners.map((name) => (
                        <Typography 
                          key={name}
                          variant="h3" 
                          color={getWinnerColor()} 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
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
                        mb: 3,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                      }}
                    >
                      {winner || 'No Clear Winner'}
                    </Typography>
                  )}
                  
                  {/* Short Explanation */}
                  <Typography 
                    variant="h6" 
                    color="text.primary" 
                    sx={{ 
                      fontWeight: 400,
                      lineHeight: 1.5,
                      px: 2,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {getWinnerExplanation()}
                  </Typography>
                </Box>
              </Paper>
              
              {/* Extended Explanation Below - Only show on larger screens or stack on mobile */}
              {matchupDetails && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: { xs: 'block', lg: matchupDetails?.[0]?.victories?.length > 5 ? 'none' : 'block' }
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional details
                  </Typography>
                  
                  {winnerType === 'condorcet' && matchupDetails.length === 1 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {matchupDetails[0].candidate} is the only candidate that wins all of their one-on-one matchups.
                      </Typography>
                      <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                        {matchupDetails[0].victories.map((v, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            • {matchupDetails[0].candidate} beats {v.opponent} by a margin of {v.margin}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {winnerType === 'most_wins' && matchupDetails.length === 1 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        No candidate beats all others head-to-head. {matchupDetails[0].candidate} has the most pairwise victories.
                      </Typography>
                      {matchupDetails[0].victories.length > 0 && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                            Victories:
                          </Typography>
                          <Box sx={{ ml: { xs: 1, sm: 2 }, mb: 1 }}>
                            {matchupDetails[0].victories.map((v, idx) => (
                              <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                • {matchupDetails[0].candidate} beats {v.opponent} by a margin of {v.margin}
                              </Typography>
                            ))}
                          </Box>
                        </>
                      )}
                      {matchupDetails[0].losses.length > 0 && (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                            Losses:
                          </Typography>
                          <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                            {matchupDetails[0].losses.map((l, idx) => (
                              <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                • {matchupDetails[0].candidate} loses to {l.opponent} by a margin of {l.margin}
                              </Typography>
                            ))}
                          </Box>
                        </>
                      )}
                    </Box>
                  )}
                  
                  {winnerType === 'smallest_loss' && matchupDetails.length === 1 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        No candidate has more wins than losses. {matchupDetails[0].candidate} has the smallest worst defeat.
                      </Typography>
                      {matchupDetails[0].losses.length > 0 && (
                        <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                          {matchupDetails[0].losses.map((l, idx) => (
                            <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              • {matchupDetails[0].candidate} loses to {l.opponent} by a margin of {l.margin}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {winnerType === 'tie' && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Multiple candidates have identical head-to-head records, resulting in a tie.
                      </Typography>
                      {matchupDetails.map((detail, idx) => (
                        <Box key={idx} sx={{ mb: idx < matchupDetails.length - 1 ? 2 : 0 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {detail.candidate}:
                          </Typography>
                          <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                            {detail.victories.map((v, vidx) => (
                              <Typography key={vidx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                • Beats {v.opponent} by a margin of {v.margin}
                              </Typography>
                            ))}
                            {detail.losses.map((l, lidx) => (
                              <Typography key={lidx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                • Loses to {l.opponent} by a margin of {l.margin}
                              </Typography>
                            ))}
                            {detail.ties.map((t, tidx) => (
                              <Typography key={tidx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                • Ties with {t.opponent}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
            
            {/* Right: Head-to-Head Matchups with View Details Button */}
            <Box sx={{ 
              flex: { xs: '1 1 auto', lg: 1 },
              minWidth: 0,
              position: 'relative' 
            }}>
              <HeadToHeadTable results={results} winnerColor={getWinnerColor()} />
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  startIcon={<VisibilityIcon />}
                  onClick={() => setBallotViewerOpen(true)}
                  size="small"
                >
                  View detailed ballot breakdowns
                </Button>
              </Box>
            </Box>
          </Box>
          
          {/* Additional details for mobile/tablet when there are many matchups */}
          {matchupDetails && matchupDetails?.[0]?.victories?.length > 5 && (
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                p: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: { xs: 'block', lg: 'none' }
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Additional details
              </Typography>
              
              {winnerType === 'condorcet' && matchupDetails.length === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {matchupDetails[0].candidate} is the only candidate that wins all of their one-on-one matchups.
                  </Typography>
                  <Box sx={{ ml: { xs: 1, sm: 2 } }}>
                    {matchupDetails[0].victories.map((v, idx) => (
                      <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        • {matchupDetails[0].candidate} beats {v.opponent} by a margin of {v.margin}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* Statistics Cards */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Card elevation={0} sx={{ px: 4, py: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <PeopleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {results.statistics?.total_votes || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Votes
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Pairwise Ballot Viewer Dialog */}
      <PairwiseBallotViewer
        pollId={pollId}
        isOpen={ballotViewerOpen}
        onClose={() => setBallotViewerOpen(false)}
      />
    </Box>
  );
};

export default PollResults;