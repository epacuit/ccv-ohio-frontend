import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CompareArrows as CompareArrowsIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import API from '../services/api';
import ReadOnlyVotingTable from './vote/ReadOnlyVotingTable';

const BallotCarousel = ({ 
  groupType, 
  comparison, 
  stats, 
  allCandidates, 
  isWinner,
  pollId,
  initialBallots = [],
  totalCount = 0,
  pollNumRanks = null
}) => {
  const [ballots, setBallots] = useState(initialBallots);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(totalCount > initialBallots.length);
  const [offset, setOffset] = useState(initialBallots.length);
  const theme = useTheme();

  // Load more ballots when needed
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await API.get(
        `/pairwise-ballots/poll/${pollId}/pairwise`,
        { 
          params: { 
            cand1_id: comparison.cand1.id,
            cand2_id: comparison.cand2.id,
            group: groupType,
            limit: 50,
            offset: offset
          }
        }
      );
      
      const newBallots = response.data.ballots;
      setBallots(prev => [...prev, ...newBallots]);
      setOffset(prev => prev + newBallots.length);
      setHasMore(response.data.has_more);
    } catch (error) {
      console.error('Error loading more ballots:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, offset, pollId, comparison, groupType]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : ballots.length - 1));
  };

  const handleNext = () => {
    // Load more when near the end
    if (currentIndex >= ballots.length - 3 && hasMore && !loading) {
      loadMore();
    }
    setCurrentIndex((prev) => (prev < ballots.length - 1 ? prev + 1 : 0));
  };

  const getBackgroundColor = () => {
    if (isWinner === true) {
      return alpha(theme.palette.success.main, 0.08);
    } else if (isWinner === false) {
      return alpha(theme.palette.error.main, 0.08);
    }
    
    switch (groupType) {
      case 'tie':
        return alpha(theme.palette.warning.main, 0.05);
      case 'undefined':
        return alpha(theme.palette.grey[500], 0.05);
      default:
        return alpha(theme.palette.grey[500], 0.03);
    }
  };

  const getBorderColor = () => {
    if (isWinner === true) {
      return theme.palette.success.main;
    } else if (isWinner === false) {
      return theme.palette.error.main;
    }
    
    switch (groupType) {
      case 'tie':
        return theme.palette.warning.main;
      case 'undefined':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const getChipColor = () => {
    if (isWinner === true) return 'success';
    if (isWinner === false) return 'error';
    return 'primary';
  };

  const getGroupTitle = () => {
    switch (groupType) {
      case 'cand1_wins':
        return `${comparison.cand1.name} beats ${comparison.cand2.name}`;
      case 'cand2_wins':
        return `${comparison.cand2.name} beats ${comparison.cand1.name}`;
      case 'tie':
        return 'Tied or Equal Ranking';
      case 'undefined':
        return 'Comparison Undefined';
      default:
        return '';
    }
  };

  const getGroupDescription = () => {
    switch (groupType) {
      case 'cand1_wins':
        return `Ballots where ${comparison.cand1.name} is ranked higher (per Alaska rules)`;
      case 'cand2_wins':
        return `Ballots where ${comparison.cand2.name} is ranked higher (per Alaska rules)`;
      case 'tie':
        return 'Ballots where both candidates have the same rank or both are unranked (no skipped ranks)';
      case 'undefined':
        return 'Ballots with skipped ranks making the comparison undefined';
      default:
        return '';
    }
  };

  const getHighlightColors = () => {
    const colors = {};
    
    switch (groupType) {
      case 'cand1_wins':
        colors[comparison.cand1.id] = 'green';
        colors[comparison.cand2.id] = 'red';
        break;
      case 'cand2_wins':
        colors[comparison.cand1.id] = 'red';
        colors[comparison.cand2.id] = 'green';
        break;
      case 'tie':
        colors[comparison.cand1.id] = 'yellow';
        colors[comparison.cand2.id] = 'yellow';
        break;
      case 'undefined':
        colors[comparison.cand1.id] = null;
        colors[comparison.cand2.id] = null;
        break;
    }
    
    return colors;
  };

  const currentBallot = ballots[currentIndex];
  const selections = {};
  
  // Check if ballot actually has rankings
  if (!currentBallot || !currentBallot.rankings || currentBallot.rankings.length === 0) {
    console.error('EMPTY BALLOT DETECTED:', currentBallot);
  } else {
    currentBallot.rankings.forEach(ranking => {
      // CRITICAL: Use exact candidate_id and convert rank to number
      selections[ranking.candidate_id] = Number(ranking.rank);
    });
  }

  // Extensive debugging
  if (currentBallot && Object.keys(selections).length === 0) {
    console.error('=== EMPTY SELECTIONS BUILT FROM BALLOT ===');
    console.error('Ballot:', currentBallot);
    console.error('This ballot will appear empty!');
  } else if (currentBallot) {
    console.log('=== BALLOT DISPLAY DEBUG ===');
    console.log('Ballot rankings:', currentBallot.rankings);
    console.log('Selections built:', selections);
    console.log('All candidates:', allCandidates.map(c => ({id: c.id, name: c.name})));
    
    // Verify all ballot candidate IDs exist in allCandidates
    const ballotIds = Object.keys(selections);
    const candidateIds = new Set(allCandidates.map(c => c.id));
    const missing = ballotIds.filter(id => !candidateIds.has(id));
    
    if (missing.length > 0) {
      console.error('CRITICAL ID MISMATCH!');
      console.error('These IDs are in ballot but NOT in allCandidates:', missing);
      console.error('This will cause empty display!');
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        border: `1px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        minHeight: { xs: 400, sm: 450 },
        height: { xs: 'auto', sm: 450 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>
          {getGroupTitle()}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {getGroupDescription()}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
          <Chip
            label={`${stats.toLocaleString()} total votes`}
            color={getChipColor()}
            size="small"
          />
          <Chip
            label={`${totalCount.toLocaleString()} unique ballots`}
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      {/* Carousel with Navigation */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Navigation */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              onClick={handlePrevious} 
              disabled={ballots.length <= 1}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Ballot {currentIndex + 1} of {totalCount}
            </Typography>
            <IconButton 
              onClick={handleNext} 
              disabled={ballots.length <= 1}
              size="small"
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
          {currentBallot?.count > 1 && (
            <Chip 
              label={`Count: ${currentBallot.count.toLocaleString()}`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          )}
        </Box>

        {/* Ballot Table Display */}
        <Box sx={{ 
          flex: 1,
          backgroundColor: 'background.paper', 
          borderRadius: 1,
          overflow: 'auto',
          minHeight: 0,
        }}>
          {currentBallot ? (
            currentBallot.rankings && currentBallot.rankings.length > 0 ? (
              <>
                {console.log('BallotCarousel passing pollNumRanks:', pollNumRanks, 'to ReadOnlyVotingTable')}
                <ReadOnlyVotingTable
                  candidates={allCandidates}
                  selections={selections}
                  title=""
                  highlightCandidates={getHighlightColors()}
                  maxRank={pollNumRanks}
                />
              </>
            ) : (
              <Box p={3} textAlign="center">
                <Typography color="error">
                  This ballot has no rankings!
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ballot ID: {currentBallot.ballot_id}
                </Typography>
              </Box>
            )
          ) : (
            <CircularProgress />
          )}
        </Box>

        {/* Load more or progress indicator */}
        {(hasMore || loading) && (
          <Box sx={{ mt: 1 }}>
            {loading ? (
              <LinearProgress sx={{ height: 2 }} />
            ) : hasMore && ballots.length >= 10 && (
              <Box textAlign="center">
                <Button
                  size="small"
                  onClick={loadMore}
                  startIcon={<ExpandMoreIcon />}
                  variant="text"
                >
                  Load more ({ballots.length} of {totalCount})
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Progress dots for small sets */}
        {totalCount <= 10 && ballots.length > 1 && (
          <Box display="flex" justifyContent="center" gap={0.5} mt={1}>
            {ballots.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: idx === currentIndex ? getBorderColor() : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const PairwiseBallotViewer = ({ pollId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisons, setComparisons] = useState([]);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [ballotData, setBallotData] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const [pollNumRanks, setPollNumRanks] = useState(null);

  // Fetch all available comparisons
  useEffect(() => {
    if (isOpen && pollId) {
      fetchComparisons();
    }
  }, [isOpen, pollId]);

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      
      // Get poll data for candidates
      const pollResponse = await API.get(`/polls/${pollId}`);
      const pollCandidates = pollResponse.data.candidates || [];
      const numRanks = pollResponse.data.num_ranks || pollCandidates.length;
      
      console.log('Poll API response num_ranks:', pollResponse.data.num_ranks);
      console.log('Setting pollNumRanks to:', numRanks);
      setPollNumRanks(numRanks);
      
      // Get all comparisons
      const response = await API.get(`/pairwise-ballots/poll/${pollId}/all-comparisons`);
      setComparisons(response.data.comparisons);
      
      // Build complete candidate list
      const candidateMap = new Map();
      
      // CRITICAL: Use the exact IDs from poll candidates
      pollCandidates.forEach(c => {
        candidateMap.set(c.id, {
          id: c.id,
          name: c.name,
          is_write_in: false
        });
      });
      
      // Add write-in candidates with their exact IDs
      response.data.comparisons.forEach(comp => {
        if (comp.cand1.is_write_in && !candidateMap.has(comp.cand1.id)) {
          candidateMap.set(comp.cand1.id, {
            id: comp.cand1.id,
            name: comp.cand1.name,
            is_write_in: true
          });
        }
        if (comp.cand2.is_write_in && !candidateMap.has(comp.cand2.id)) {
          candidateMap.set(comp.cand2.id, {
            id: comp.cand2.id,
            name: comp.cand2.name,
            is_write_in: true
          });
        }
      });
      
      setAllCandidates(Array.from(candidateMap.values()));
      
      // Auto-select first comparison
      if (response.data.comparisons.length > 0) {
        const first = response.data.comparisons[0];
        setSelectedComparison(`${first.cand1.id}|${first.cand2.id}`);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching comparisons:', err);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ballot data for selected comparison
  useEffect(() => {
    if (selectedComparison && pollId) {
      fetchBallotData();
    }
  }, [selectedComparison, pollId]);

  const fetchBallotData = async () => {
    try {
      const [cand1Id, cand2Id] = selectedComparison.split('|');
      const response = await API.get(
        `/pairwise-ballots/poll/${pollId}/pairwise`,
        { 
          params: { 
            cand1_id: cand1Id, 
            cand2_id: cand2Id
          }
        }
      );
      
      // COMPLETELY REBUILD candidate list from scratch using ballot data
      const candidateMap = new Map();
      
      // Process ALL ballots to find ALL candidates
      const allBallotGroups = [
        ...(response.data.ballots.cand1_wins || []),
        ...(response.data.ballots.cand2_wins || []),
        ...(response.data.ballots.tie || []),
        ...(response.data.ballots.undefined || [])
      ];
      
      console.log('Processing', allBallotGroups.length, 'ballots to find all candidates');
      
      // Extract every unique candidate from every ballot
      allBallotGroups.forEach((ballot, idx) => {
        if (!ballot.rankings || ballot.rankings.length === 0) {
          console.warn(`Ballot ${idx} has no rankings!`, ballot);
        } else {
          ballot.rankings.forEach(ranking => {
            const id = ranking.candidate_id;
            const name = ranking.candidate_name || id;
            
            if (!candidateMap.has(id)) {
              candidateMap.set(id, {
                id: id,  // Use EXACT ID from ballot
                name: name,
                is_write_in: id.includes('write') || id.includes('writein')
              });
            }
          });
        }
      });
      
      // Also include the two candidates being compared if not already there
      if (!candidateMap.has(cand1Id)) {
        candidateMap.set(cand1Id, {
          id: cand1Id,
          name: response.data.comparison.cand1.name || cand1Id,
          is_write_in: false
        });
      }
      if (!candidateMap.has(cand2Id)) {
        candidateMap.set(cand2Id, {
          id: cand2Id,
          name: response.data.comparison.cand2.name || cand2Id,
          is_write_in: false
        });
      }
      
      const finalCandidates = Array.from(candidateMap.values());
      console.log('Final candidate list built from ballot data:', finalCandidates);
      console.log('Candidate IDs:', finalCandidates.map(c => c.id));
      
      // Update both local and parent state
      setAllCandidates(finalCandidates);
      setBallotData(response.data);
    } catch (err) {
      console.error('Error fetching ballot data:', err);
      setError('Failed to load ballot data');
    }
  };

  const handleComparisonChange = (event) => {
    setSelectedComparison(event.target.value);
    setBallotData(null); // Clear old data when switching
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={window.innerWidth < 600}
      PaperProps={{
        sx: { height: { xs: '100vh', sm: '90vh' } }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityIcon color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Pairwise Ballot Viewer</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box>
            {/* Comparison Selector */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Comparison</InputLabel>
                <Select
                  value={selectedComparison || ''}
                  onChange={handleComparisonChange}
                  label="Select Comparison"
                  startAdornment={<CompareArrowsIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  {comparisons.map((comp) => {
                    const value = `${comp.cand1.id}|${comp.cand2.id}`;
                    const totalVotes = Object.values(comp.quick_stats).reduce((a, b) => a + b, 0);
                    
                    return (
                      <MenuItem key={value} value={value}>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" width="100%" gap={{ xs: 0.5, sm: 0 }}>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                              {comp.cand1.name} vs {comp.cand2.name}
                            </Typography>
                            {(comp.cand1.is_write_in || comp.cand2.is_write_in) && (
                              <Chip label="write-in" size="small" color="secondary" />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {totalVotes.toLocaleString()} votes
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            {/* Ballot Groups */}
            {ballotData && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {ballotData.comparison.cand1.name} vs {ballotData.comparison.cand2.name}
                </Typography>
                
                {/* Summary Stats at the top */}
                <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, backgroundColor: 'grey.50' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total Votes
                      </Typography>
                      <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {ballotData.total_votes.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Valid Comparisons
                      </Typography>
                      <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {(ballotData.votes_with_comparison || (ballotData.total_votes - (ballotData.stats.undefined || 0))).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        out of {ballotData.total_votes.toLocaleString()} votes
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Winner
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {ballotData.stats.cand1_wins > ballotData.stats.cand2_wins
                          ? ballotData.comparison.cand1.name
                          : ballotData.stats.cand2_wins > ballotData.stats.cand1_wins
                          ? ballotData.comparison.cand2.name
                          : 'Tie'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Margin of Victory
                      </Typography>
                      <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {Math.abs(ballotData.stats.cand1_wins - ballotData.stats.cand2_wins).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
                
                {/* Display Non-Empty Ballot Groups Only */}
                {(() => {
                  const cand1Wins = ballotData.stats.cand1_wins > ballotData.stats.cand2_wins;
                  const isTie = ballotData.stats.cand1_wins === ballotData.stats.cand2_wins;
                  const winnerGroupType = cand1Wins ? 'cand1_wins' : 'cand2_wins';
                  const loserGroupType = cand1Wins ? 'cand2_wins' : 'cand1_wins';
                  
                  // Build array of groups to display (only non-empty ones)
                  const groupsToDisplay = [];
                  
                  // Add winner group if it has votes (not a tie)
                  if (!isTie && ballotData.stats[winnerGroupType] > 0) {
                    groupsToDisplay.push({
                      type: winnerGroupType,
                      isWinner: true,
                      stats: ballotData.stats[winnerGroupType],
                      ballots: ballotData.ballots[winnerGroupType],
                      count: ballotData.ballot_counts[winnerGroupType]
                    });
                  }
                  
                  // Add loser group if it has votes (not a tie)
                  if (!isTie && ballotData.stats[loserGroupType] > 0) {
                    groupsToDisplay.push({
                      type: loserGroupType,
                      isWinner: false,
                      stats: ballotData.stats[loserGroupType],
                      ballots: ballotData.ballots[loserGroupType],
                      count: ballotData.ballot_counts[loserGroupType]
                    });
                  }
                  
                  // For ties, show both as equals if they have votes
                  if (isTie) {
                    if (ballotData.stats.cand1_wins > 0) {
                      groupsToDisplay.push({
                        type: 'cand1_wins',
                        isWinner: null,
                        stats: ballotData.stats.cand1_wins,
                        ballots: ballotData.ballots.cand1_wins,
                        count: ballotData.ballot_counts.cand1_wins
                      });
                    }
                    if (ballotData.stats.cand2_wins > 0) {
                      groupsToDisplay.push({
                        type: 'cand2_wins',
                        isWinner: null,
                        stats: ballotData.stats.cand2_wins,
                        ballots: ballotData.ballots.cand2_wins,
                        count: ballotData.ballot_counts.cand2_wins
                      });
                    }
                  }
                  
                  // Add tie group if it has votes
                  if (ballotData.stats.tie > 0) {
                    groupsToDisplay.push({
                      type: 'tie',
                      isWinner: null,
                      stats: ballotData.stats.tie,
                      ballots: ballotData.ballots.tie,
                      count: ballotData.ballot_counts.tie
                    });
                  }
                  
                  // Add undefined group if it has votes
                  if (ballotData.stats.undefined > 0) {
                    groupsToDisplay.push({
                      type: 'undefined',
                      isWinner: null,
                      stats: ballotData.stats.undefined,
                      ballots: ballotData.ballots.undefined,
                      count: ballotData.ballot_counts.undefined
                    });
                  }
                  
                  // Display groups using flexbox for precise width control
                  return (
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: 2,
                      '& > *': {
                        // Mobile: Single column
                        flex: { 
                          xs: '1 1 100%',
                          sm: groupsToDisplay.length === 1 ? '1 1 100%' :
                              groupsToDisplay.length === 2 ? '1 1 calc(50% - 8px)' :
                              groupsToDisplay.length === 3 ? '1 1 calc(33.333% - 11px)' :
                              groupsToDisplay.length === 4 ? '0 0 calc(50% - 8px)' :
                              '1 1 calc(33.333% - 11px)'
                        },
                        maxWidth: { 
                          xs: '100%',
                          sm: groupsToDisplay.length === 4 ? 'calc(50% - 8px)' : 'none'
                        },
                      }
                    }}>
                      {groupsToDisplay.map((group) => (
                        <Box key={group.type}>
                          <BallotCarousel
                            groupType={group.type}
                            comparison={ballotData.comparison}
                            stats={group.stats}
                            allCandidates={allCandidates}
                            isWinner={group.isWinner}
                            pollId={pollId}
                            initialBallots={group.ballots}
                            totalCount={group.count}
                            pollNumRanks={pollNumRanks}
                          />
                        </Box>
                      ))}
                      {/* If no groups have any votes, show a message */}
                      {groupsToDisplay.length === 0 && (
                        <Box sx={{ width: '100%' }}>
                          <Alert severity="warning">
                            No valid ballot comparisons found. All ballots may have undefined rankings due to skipped ranks above one or both candidates.
                          </Alert>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PairwiseBallotViewer;