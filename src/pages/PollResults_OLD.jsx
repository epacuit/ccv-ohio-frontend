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
  useTheme,
  alpha,
  Collapse,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  FormatListNumbered as ListIcon,
  School as SchoolIcon,
  Handshake as HandshakeIcon,
  SearchOff as NotFoundIcon,
} from '@mui/icons-material';
import API from '../services/api';
import WinnerExplanation from '../components/WinnerExplanation';
import PollDetails from '../components/PollDetails';
import HeadToHeadTable from '../components/HeadToHeadTableV2';
import { WINNER_TYPE_COLORS } from '../constants/winnerColors';
import { POLL_SLUGS } from '../constants/pollMappings';

const PollResults = () => {
  const { pollId: urlParam } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [results, setResults] = useState(null);
  const [poll, setPoll] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  const pollId = POLL_SLUGS[urlParam] || urlParam;

  // Fetch poll details and results
  const fetchData = async () => {
    try {
      const [pollResponse, resultsResponse] = await Promise.all([
        API.get(`/polls/${pollId}`),
        API.get(`/results/poll/${pollId}/detailed?include_test=false`)
      ]);
      
      setPoll(pollResponse.data);
      setResults(resultsResponse.data);
      setError('');
      setNotFound(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        console.error('Error fetching data:', err);
        setError('Failed to load results. Please try again.');
      }
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
      <Box sx={{ mt:'134.195px',  minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (notFound) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <NotFoundIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Poll Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Poll with ID "{urlParam}" was not found.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please check the link and try again, or contact the poll creator.
            </Typography>
            <Box mt={4}>
              <Button 
                variant="contained" 
                onClick={() => navigate('/')}
                size="large"
              >
                Go to Home Page
              </Button>
            </Box>
          </Paper>
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

  // Check if there are no votes (use total_voters, not total_ballots)
  if (results.total_voters === 0) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box>
                <Typography variant="h4" component="h1">
                  {poll.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Live Results Dashboard
                </Typography>
              </Box>
              <Tooltip title={autoRefresh ? "Auto-refreshing every 5 seconds" : "Click to enable auto-refresh"}>
                <IconButton 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  color={autoRefresh ? "primary" : "default"}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Poll Details */}
            <PollDetails poll={poll} sx={{ mb: 4 }} />

            {/* No votes message */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.grey[100], 0.5),
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                No votes yet
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Waiting for participants to submit their ballots...
              </Typography>
              {autoRefresh && (
                <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                  This page will automatically update when votes are received
                </Typography>
              )}
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  const hasCondorcetWinner = results.winner_type === 'condorcet';
  const hasWeakCondorcetWinner = results.winner_type === 'weak_condorcet';
  const hasNoCondorcetWinner = results.winner_type === 'copeland' || results.winner_type === 'minimax';
  const hasTie = results.is_tie;
  
  // Get the winner(s) and winner type from backend
  const winner = results.determined_winner;
  const tiedWinners = results.tied_winners || [];
  const winnerType = results.winner_type;
  
  // Determine colors and text based on winner type
  const getWinnerColor = () => {
    if (hasTie) return WINNER_TYPE_COLORS.tied;
    switch (winnerType) {
      case 'condorcet': return WINNER_TYPE_COLORS.condorcet;
      case 'weak_condorcet': return WINNER_TYPE_COLORS.weak;
      case 'copeland': return WINNER_TYPE_COLORS.copeland;
      case 'minimax': return WINNER_TYPE_COLORS.minimax;
      default: return theme.palette.grey[500];
    }
  };
  
  const getWinnerTitle = () => {
    if (hasTie) {
      return 'Consensus Choice Winners (tied)';
    }
    return 'Consensus Choice Winner';
  };
  
  // Calculate ballot type breakdown for pie chart
  const calculateBallotTypes = () => {
    let bulletVotes = 0;
    let partialWithTies = 0;
    let partialNoTies = 0;
    let completeWithTies = 0;
    let completeNoTies = 0;
    
    const totalCandidates = results.candidates.length;
    
    results.ballot_types.forEach(ballotType => {
      const rankedCandidates = new Set();
      let hasTies = false;
      
      // Count unique candidates and check for ties
      ballotType.ranking.forEach(tier => {
        if (tier.length > 1) hasTies = true;
        tier.forEach(candidate => rankedCandidates.add(candidate));
      });
      
      const numRanked = rankedCandidates.size;
      
      // Categorize the ballot (using count properly)
      if (numRanked === 1) {
        bulletVotes += ballotType.count;
      } else if (numRanked === totalCandidates) {
        if (hasTies) {
          completeWithTies += ballotType.count;
        } else {
          completeNoTies += ballotType.count;
        }
      } else {
        if (hasTies) {
          partialWithTies += ballotType.count;
        } else {
          partialNoTies += ballotType.count;
        }
      }
    });
    
    return [
      { name: 'Bullet Votes', value: bulletVotes, color: '#ff9800', description: 'Ranked exactly one candidate' },
      { name: 'Partial Rankings (with ties)', value: partialWithTies, color: '#9c27b0', description: 'Ranked 2+ candidates (not all) with ties' },
      { name: 'Partial Rankings (no ties)', value: partialNoTies, color: '#e91e63', description: 'Ranked 2+ candidates (not all) without ties' },
      { name: 'Complete Rankings (with ties)', value: completeWithTies, color: '#03a9f4', description: 'Ranked all candidates with ties' },
      { name: 'Complete Rankings (no ties)', value: completeNoTies, color: '#4caf50', description: 'Ranked all candidates without ties' },
    ].filter(item => item.value > 0); // Only show categories with votes
  };
  
  const ballotTypeData = calculateBallotTypes();

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1">
              {poll.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live Results Dashboard
            </Typography>
          </Box>
          <Tooltip title={autoRefresh ? "Auto-refreshing every 5 seconds" : "Click to enable auto-refresh"}>
            <IconButton 
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? "primary" : "default"}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Poll Details */}
        <Box sx={{ mb: 4 }}>
          <PollDetails poll={poll} />
        </Box>

        {/* Winner Announcement and Matchup Table - NO SPACING */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          {/* Left: Winner Announcement - EXACTLY 50% */}
          <Box sx={{ flex: 1 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: '100%',
                minHeight: 400,
                background: alpha(getWinnerColor(), 0.05),
                border: `2px solid ${getWinnerColor()}`,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Box textAlign="center">
                {hasTie ? (
                  <HandshakeIcon sx={{ fontSize: 60, color: getWinnerColor(), mb: 2 }} />
                ) : (
                  <TrophyIcon sx={{ fontSize: 60, color: getWinnerColor(), mb: 2 }} />
                )}
                <Typography variant="h5" component="h2" gutterBottom>
                  {getWinnerTitle()}
                </Typography>
                {hasTie ? (
                  <Box>
                    <Typography variant="h4" color={getWinnerColor()} sx={{ fontWeight: 'bold', mb: 2 }}>
                      {tiedWinners.join(' & ')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      These candidates are tied based on the voting results
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="h3" color={getWinnerColor()} sx={{ fontWeight: 'bold', mb: 2 }}>
                    {winner || 'No Clear Winner'}
                  </Typography>
                )}
                
                {/* Explain Button */}
                {(winner || hasTie) && (
                  <Box mt={3}>
                    <Button
                      variant="contained"
                      startIcon={<SchoolIcon />}
                      onClick={() => setShowExplanation(!showExplanation)}
                      size="large"
                      sx={{
                        backgroundColor: getWinnerColor(),
                        '&:hover': {
                          backgroundColor: alpha(getWinnerColor(), 0.8),
                        }
                      }}
                    >
                      {showExplanation ? 'Hide' : 'Show'} How Winner is Determined
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
          
          {/* Right: Head-to-Head Matchups - EXACTLY 50% */}
          <Box sx={{ flex: 1 }}>
            <HeadToHeadTable results={results} winnerColor={getWinnerColor()} />
          </Box>
        </Box>

        {/* Winner Explanation Animation - FULL WIDTH */}
        <Collapse in={showExplanation}>
          <Box sx={{ mb: 4 }}>
            <Paper elevation={0} sx={{ p: 3 }}>
              <WinnerExplanation 
                results={results} 
                winner={winner} 
                tiedWinners={tiedWinners}
                winnerType={winnerType}
              />
            </Paper>
          </Box>
        </Collapse>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Grid container spacing={5} maxWidth={600}>
          {/* Total Votes */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                  <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Total Votes</Typography>
                </Box>
                <Typography variant="h3" color="primary.main">
                  {results.total_voters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submitted votes
                </Typography>
                {results.total_ballots !== results.total_voters && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    ({results.total_ballots} ballot records)
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Unique Rankings */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
                  <ListIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">Unique Rankings</Typography>
                </Box>
                <Typography variant="h3" color="secondary.main">
                  {results.ballot_types.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Different ballot patterns
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Ballot Types Distribution */}
      <Box sx={{ mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            width: '100%', 
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" align="center" gutterBottom>
            Ballot Type Distribution
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            How voters filled out their ballots
          </Typography>
          
          <Box sx={{ width: '100%' }}>
            {ballotTypeData.map((item, index) => {
              const percentage = (item.value / results.total_voters) * 100;
              return (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${item.value} (${percentage.toFixed(1)}%)`}
                      size="small"
                      sx={{ 
                        backgroundColor: alpha(item.color, 0.2),
                        color: item.color,
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={percentage} 
                    sx={{
                      height: 20,
                      borderRadius: 2,
                      backgroundColor: alpha(item.color, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color,
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
              );
            })}
            
            {ballotTypeData.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                No ballot data available
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
      </Box> {/* Closing Box for maxWidth wrapper */}
    </Container>
    </Box>
  );
};

export default PollResults;