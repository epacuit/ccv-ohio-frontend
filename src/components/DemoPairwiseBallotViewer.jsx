import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Grid,
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
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CompareArrows as CompareArrowsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import ReadOnlyVotingTable from './vote/ReadOnlyVotingTable';

const BallotCarousel = ({ 
  groupType, 
  comparison, 
  stats, 
  allCandidates, 
  isWinner,
  ballots,
  totalCount
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : ballots.length - 1));
  };

  const handleNext = () => {
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
        return `Ballots where ${comparison.cand1.name} is ranked higher`;
      case 'cand2_wins':
        return `Ballots where ${comparison.cand2.name} is ranked higher`;
      case 'tie':
        return 'Ballots where both candidates have the same rank or both are unranked';
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

  if (!ballots || ballots.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${getBorderColor()}`,
          backgroundColor: getBackgroundColor(),
          minHeight: 450,
          height: 450,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {getGroupTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No ballots in this category
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        minHeight: 450,
        height: 450,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          {getGroupTitle()}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {getGroupDescription()}
        </Typography>
        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <IconButton 
              onClick={handlePrevious} 
              disabled={ballots.length <= 1}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="caption" color="text.secondary">
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
            <ReadOnlyVotingTable
              candidates={allCandidates}
              selections={currentBallot.rankings}
              title=""
              highlightCandidates={getHighlightColors()}
              maxRank={allCandidates.length}
            />
          ) : (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                No ballots to display
              </Typography>
            </Box>
          )}
        </Box>

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

const DemoPairwiseBallotViewer = ({ 
  isOpen, 
  onClose, 
  candidates, 
  ballots, 
  results 
}) => {
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [allComparisons, setAllComparisons] = useState([]);

  // Process ballots to determine pairwise comparison
  const processComparison = (ballot, cand1Name, cand2Name) => {
    const rank1 = ballot.rankings[cand1Name];
    const rank2 = ballot.rankings[cand2Name];
    
    if (!rank1 && !rank2) {
      return 'tie'; // Both unranked
    }
    if (!rank1 && rank2) {
      return 'cand2_wins'; // Only cand2 ranked
    }
    if (rank1 && !rank2) {
      return 'cand1_wins'; // Only cand1 ranked
    }
    if (rank1 < rank2) {
      return 'cand1_wins'; // cand1 ranked higher (lower number)
    }
    if (rank2 < rank1) {
      return 'cand2_wins'; // cand2 ranked higher (lower number)
    }
    if (rank1 === rank2) {
      return 'tie'; // Same rank
    }
    return 'undefined';
  };

  // Initialize comparisons
  useEffect(() => {
    if (isOpen && candidates.length > 0) {
      const comparisons = [];
      
      // Generate all pairwise comparisons
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const cand1 = candidates[i];
          const cand2 = candidates[j];
          
          // Calculate stats for this comparison
          const stats = {
            cand1_wins: 0,
            cand2_wins: 0,
            tie: 0,
            undefined: 0
          };
          
          ballots.forEach(ballot => {
            const result = processComparison(ballot, cand1.name, cand2.name);
            stats[result] += ballot.count;
          });
          
          comparisons.push({
            cand1: { id: cand1.id, name: cand1.name },
            cand2: { id: cand2.id, name: cand2.name },
            stats: stats,
            key: `${cand1.name}|${cand2.name}`
          });
        }
      }
      
      setAllComparisons(comparisons);
      
      // Auto-select first comparison
      if (comparisons.length > 0) {
        setSelectedComparison(comparisons[0].key);
      }
    }
  }, [isOpen, candidates, ballots]);

  // Process selected comparison data
  useEffect(() => {
    if (selectedComparison) {
      const comparison = allComparisons.find(c => c.key === selectedComparison);
      if (comparison) {
        // Group ballots by comparison result
        const grouped = {
          cand1_wins: [],
          cand2_wins: [],
          tie: [],
          undefined: []
        };
        
        ballots.forEach(ballot => {
          const result = processComparison(
            ballot, 
            comparison.cand1.name, 
            comparison.cand2.name
          );
          
          grouped[result].push({
            id: ballot.id,
            rankings: ballot.rankings,
            count: ballot.count
          });
        });
        
        setComparisonData({
          comparison: comparison,
          grouped: grouped,
          stats: comparison.stats
        });
      }
    }
  }, [selectedComparison, allComparisons, ballots]);

  const handleComparisonChange = (event) => {
    setSelectedComparison(event.target.value);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityIcon color="primary" />
          <Typography variant="h6">Pairwise Ballot Viewer</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
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
                {allComparisons.map((comp) => {
                  const totalVotes = Object.values(comp.stats).reduce((a, b) => a + b, 0);
                  
                  return (
                    <MenuItem key={comp.key} value={comp.key}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography>
                          {comp.cand1.name} vs {comp.cand2.name}
                        </Typography>
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
          {comparisonData && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                {comparisonData.comparison.cand1.name} vs {comparisonData.comparison.cand2.name}
              </Typography>
              
              {/* Summary Stats */}
              <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
                <Grid container spacing={3}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Votes
                    </Typography>
                    <Typography variant="h5">
                      {Object.values(comparisonData.stats).reduce((a, b) => a + b, 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Winner
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {comparisonData.stats.cand1_wins > comparisonData.stats.cand2_wins
                        ? comparisonData.comparison.cand1.name
                        : comparisonData.stats.cand2_wins > comparisonData.stats.cand1_wins
                        ? comparisonData.comparison.cand2.name
                        : 'Tie'}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Margin
                    </Typography>
                    <Typography variant="h5">
                      {Math.abs(comparisonData.stats.cand1_wins - comparisonData.stats.cand2_wins).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Unique Ballots
                    </Typography>
                    <Typography variant="h5">
                      {ballots.length}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Display Ballot Groups */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 2,
              }}>
                {(() => {
                  const cand1Wins = comparisonData.stats.cand1_wins > comparisonData.stats.cand2_wins;
                  const isTie = comparisonData.stats.cand1_wins === comparisonData.stats.cand2_wins;
                  
                  const groupsToDisplay = [];
                  
                  // Add winner group
                  if (!isTie && comparisonData.stats.cand1_wins > 0) {
                    groupsToDisplay.push({
                      type: 'cand1_wins',
                      isWinner: cand1Wins,
                      stats: comparisonData.stats.cand1_wins,
                      ballots: comparisonData.grouped.cand1_wins,
                      count: comparisonData.grouped.cand1_wins.length
                    });
                  }
                  
                  if (!isTie && comparisonData.stats.cand2_wins > 0) {
                    groupsToDisplay.push({
                      type: 'cand2_wins',
                      isWinner: !cand1Wins,
                      stats: comparisonData.stats.cand2_wins,
                      ballots: comparisonData.grouped.cand2_wins,
                      count: comparisonData.grouped.cand2_wins.length
                    });
                  }
                  
                  // For ties, show both as equals
                  if (isTie) {
                    if (comparisonData.stats.cand1_wins > 0) {
                      groupsToDisplay.push({
                        type: 'cand1_wins',
                        isWinner: null,
                        stats: comparisonData.stats.cand1_wins,
                        ballots: comparisonData.grouped.cand1_wins,
                        count: comparisonData.grouped.cand1_wins.length
                      });
                    }
                    if (comparisonData.stats.cand2_wins > 0) {
                      groupsToDisplay.push({
                        type: 'cand2_wins',
                        isWinner: null,
                        stats: comparisonData.stats.cand2_wins,
                        ballots: comparisonData.grouped.cand2_wins,
                        count: comparisonData.grouped.cand2_wins.length
                      });
                    }
                  }
                  
                  // Add tie group if it has votes
                  if (comparisonData.stats.tie > 0) {
                    groupsToDisplay.push({
                      type: 'tie',
                      isWinner: null,
                      stats: comparisonData.stats.tie,
                      ballots: comparisonData.grouped.tie,
                      count: comparisonData.grouped.tie.length
                    });
                  }
                  
                  return groupsToDisplay.map((group) => (
                    <Box 
                      key={group.type} 
                      sx={{ 
                        flex: groupsToDisplay.length <= 2 ? '1 1 calc(50% - 8px)' :
                              groupsToDisplay.length === 3 ? '1 1 calc(33.333% - 11px)' :
                              '0 0 calc(50% - 8px)',
                        maxWidth: groupsToDisplay.length === 4 ? 'calc(50% - 8px)' : 'none',
                      }}
                    >
                      <BallotCarousel
                        groupType={group.type}
                        comparison={comparisonData.comparison}
                        stats={group.stats}
                        allCandidates={candidates}
                        isWinner={group.isWinner}
                        ballots={group.ballots}
                        totalCount={group.count}
                      />
                    </Box>
                  ));
                })()}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DemoPairwiseBallotViewer;