import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Radio,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import API from '../services/api';
import { generateMatchups, matchupKey } from './vote/PairwiseVoteForm';

/**
 * A single matchup card for ballot display, with optional highlight.
 * highlight: 'green' | 'red' | 'warning' | null
 */
const MatchupCard = ({ cand1, cand2, sel, highlight }) => {
  const borderColor = highlight === 'green'
    ? 'success.main'
    : highlight === 'red'
      ? 'error.main'
      : highlight === 'warning'
        ? 'warning.light'
        : 'divider';

  const bgColor = highlight === 'green'
    ? 'success.50'
    : highlight === 'red'
      ? 'error.50'
      : 'background.paper';

  return (
    <Paper
      variant="outlined"
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1,
        borderColor,
        backgroundColor: bgColor,
        borderWidth: highlight ? 2 : 1,
      }}
    >
      {/* Candidate 1 */}
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 0.5 }}>
        <Radio
          checked={sel.cand1}
          disabled
          sx={{
            p: 0.5, mr: 1, flexShrink: 0,
            '& .MuiSvgIcon-root': { fontSize: 26 },
          }}
        />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {cand1.name}
        </Typography>
      </Box>

      {/* Candidate 2 */}
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 0.5 }}>
        <Radio
          checked={sel.cand2}
          disabled
          sx={{
            p: 0.5, mr: 1, flexShrink: 0,
            '& .MuiSvgIcon-root': { fontSize: 26 },
          }}
        />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {cand2.name}
        </Typography>
      </Box>

      {/* Status labels */}
      {sel.cand1 && sel.cand2 && (
        <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5, ml: 4.5, fontStyle: 'italic' }}>
          Both selected: No preference recorded
        </Typography>
      )}
      {!sel.cand1 && !sel.cand2 && (
        <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5, ml: 4.5, fontStyle: 'italic' }}>
          Neither selected: No preference recorded
        </Typography>
      )}
    </Paper>
  );
};

/**
 * BallotDisplay - shows a single ballot's matchups with optional matchup highlighting.
 */
const BallotDisplay = ({ ballot, candidates, matchups, focusMatchup }) => {
  const choices = ballot.pairwise_choices || [];

  // Build selections lookup
  const selectionsMap = {};
  choices.forEach((choice) => {
    const key = matchupKey(choice.cand1_id, choice.cand2_id);
    const isFlipped = choice.cand2_id < choice.cand1_id;
    if (choice.choice === 'tie') {
      selectionsMap[key] = { cand1: true, cand2: true };
    } else if (choice.choice === 'neither') {
      selectionsMap[key] = { cand1: false, cand2: false };
    } else if (!isFlipped) {
      selectionsMap[key] = {
        cand1: choice.choice === 'cand1',
        cand2: choice.choice === 'cand2',
      };
    } else {
      selectionsMap[key] = {
        cand1: choice.choice === 'cand2',
        cand2: choice.choice === 'cand1',
      };
    }
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 420, mx: 'auto' }}>
      {matchups.map((matchup) => {
        const sel = selectionsMap[matchup.key] || { cand1: false, cand2: false };

        // Determine highlight for this matchup
        let highlight = null;
        if (focusMatchup && matchup.key === focusMatchup.key) {
          const isTie = sel.cand1 && sel.cand2;
          const isBlank = !sel.cand1 && !sel.cand2;
          if (isTie || isBlank) {
            highlight = 'warning';
          } else if (sel.cand1) {
            // cand1 selected — green if cand1 is the "focus" winner side
            highlight = 'green';
          } else {
            highlight = 'green';
          }

          // More precise: green for winner, red for loser in this matchup
          if (!isTie && !isBlank) {
            // The selected candidate gets green border
            highlight = 'green';
          }
        }

        return (
          <MatchupCard
            key={matchup.key}
            cand1={matchup.cand1}
            cand2={matchup.cand2}
            sel={sel}
            highlight={highlight}
          />
        );
      })}
    </Box>
  );
};

const PairwiseBallotViewer = ({ pollId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allBallots, setAllBallots] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedMatchup, setSelectedMatchup] = useState('all');
  const [activeTab, setActiveTab] = useState(0); // 0 = cand1 wins, 1 = cand2 wins, 2 = tie/neither
  const [currentIndex, setCurrentIndex] = useState(0);

  const matchups = useMemo(() => generateMatchups(candidates), [candidates]);

  useEffect(() => {
    if (isOpen && pollId) {
      fetchData();
    }
  }, [isOpen, pollId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [pollResp, ballotsResp] = await Promise.all([
        API.get(`/polls/${pollId}`),
        API.get(`/ballots/poll/${pollId}/public`),
      ]);

      setCandidates(pollResp.data.candidates || []);
      setAllBallots(ballotsResp.data || []);
      setCurrentIndex(0);
      setSelectedMatchup('all');
      setActiveTab(0);
    } catch (err) {
      console.error('Error fetching ballot data:', err);
      setError('Failed to load ballot data');
    } finally {
      setLoading(false);
    }
  };

  // Get the focused matchup object
  const focusMatchup = useMemo(() => {
    if (selectedMatchup === 'all') return null;
    return matchups.find((m) => m.key === selectedMatchup) || null;
  }, [selectedMatchup, matchups]);

  // Filter and group ballots by the selected matchup
  const filteredBallots = useMemo(() => {
    if (!focusMatchup) return { all: allBallots };

    const cand1Wins = [];
    const cand2Wins = [];
    const tieOrNeither = [];

    allBallots.forEach((ballot) => {
      const choice = (ballot.pairwise_choices || []).find(
        (c) => c.cand1_id === focusMatchup.cand1.id && c.cand2_id === focusMatchup.cand2.id
      );

      if (!choice || choice.choice === 'neither') {
        tieOrNeither.push(ballot);
      } else if (choice.choice === 'cand1') {
        cand1Wins.push(ballot);
      } else if (choice.choice === 'cand2') {
        cand2Wins.push(ballot);
      } else if (choice.choice === 'tie') {
        tieOrNeither.push(ballot);
      }
    });

    return { cand1Wins, cand2Wins, tieOrNeither };
  }, [allBallots, focusMatchup]);

  // Get the current list based on tab
  const currentList = useMemo(() => {
    if (!focusMatchup) return filteredBallots.all || [];
    if (activeTab === 0) return filteredBallots.cand1Wins || [];
    if (activeTab === 1) return filteredBallots.cand2Wins || [];
    return filteredBallots.tieOrNeither || [];
  }, [filteredBallots, focusMatchup, activeTab]);

  const totalVotes = useMemo(
    () => allBallots.reduce((sum, b) => sum + (b.count || 1), 0),
    [allBallots]
  );

  const currentBallot = currentList[currentIndex];

  // Count votes in each group
  const countVotes = (list) => list.reduce((sum, b) => sum + (b.count || 1), 0);

  // Reset index when changing matchup or tab
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedMatchup, activeTab]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : currentList.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <VisibilityIcon color="primary" />
          <Typography variant="h6">Ballot Viewer</Typography>
          <Chip
            label={`${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`}
            color="primary"
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : allBallots.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">No ballots have been submitted yet.</Typography>
          </Box>
        ) : (
          <Box>
            {/* Matchup selector */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Focus on matchup</InputLabel>
              <Select
                value={selectedMatchup}
                onChange={(e) => setSelectedMatchup(e.target.value)}
                label="Focus on matchup"
                startAdornment={<CompareArrowsIcon sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="all">All ballots (no filter)</MenuItem>
                {matchups.map((m) => (
                  <MenuItem key={m.key} value={m.key}>
                    {m.cand1.name} vs {m.cand2.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tabs for filtered groups */}
            {focusMatchup && (
              <>
                {(() => {
                  const cand1Votes = countVotes(filteredBallots.cand1Wins || []);
                  const cand2Votes = countVotes(filteredBallots.cand2Wins || []);
                  const margin = Math.abs(cand1Votes - cand2Votes);
                  const winner = cand1Votes > cand2Votes ? focusMatchup.cand1.name : focusMatchup.cand2.name;
                  const loser = cand1Votes > cand2Votes ? focusMatchup.cand2.name : focusMatchup.cand1.name;
                  const winnerVotes = Math.max(cand1Votes, cand2Votes);
                  const loserVotes = Math.min(cand1Votes, cand2Votes);

                  return (
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, mb: 2, textAlign: 'center', backgroundColor: 'grey.50' }}
                    >
                      {cand1Votes === cand2Votes ? (
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {focusMatchup.cand1.name} and {focusMatchup.cand2.name} are tied: {cand1Votes} - {cand2Votes}
                        </Typography>
                      ) : (
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {winner} defeats {loser} by a margin of {winnerVotes} - {loserVotes} = {margin}
                        </Typography>
                      )}
                    </Paper>
                  );
                })()}
                <Tabs
                  value={activeTab}
                  onChange={(e, v) => setActiveTab(v)}
                  sx={{
                    mb: 2,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, minHeight: 40 },
                  }}
                  variant="fullWidth"
                >
                  <Tab
                    label={`${focusMatchup.cand1.name} (${countVotes(filteredBallots.cand1Wins || [])})`}
                    sx={{ color: 'success.main' }}
                  />
                  <Tab
                    label={`${focusMatchup.cand2.name} (${countVotes(filteredBallots.cand2Wins || [])})`}
                    sx={{ color: 'success.main' }}
                  />
                  <Tab
                    label={`Tie/Skip (${countVotes(filteredBallots.tieOrNeither || [])})`}
                  />
                </Tabs>
              </>
            )}

            {/* Navigation */}
            {currentList.length > 0 ? (
              <>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                      onClick={handlePrevious}
                      disabled={currentList.length <= 1}
                      size="small"
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                      Ballot {currentIndex + 1} of {currentList.length}
                    </Typography>
                    <IconButton
                      onClick={handleNext}
                      disabled={currentList.length <= 1}
                      size="small"
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </Box>

                  {currentBallot?.count > 1 && (
                    <Chip
                      label={`${currentBallot.count} voter${currentBallot.count !== 1 ? 's' : ''}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Ballot display */}
                {currentBallot && (
                  <BallotDisplay
                    ballot={currentBallot}
                    candidates={candidates}
                    matchups={matchups}
                    focusMatchup={focusMatchup}
                  />
                )}

                {/* Progress dots */}
                {currentList.length > 1 && currentList.length <= 15 && (
                  <Box display="flex" justifyContent="center" gap={0.5} mt={2}>
                    {currentList.map((_, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: idx === currentIndex ? 'primary.main' : 'grey.300',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setCurrentIndex(idx)}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography color="text.secondary">
                  No ballots in this group.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PairwiseBallotViewer;
