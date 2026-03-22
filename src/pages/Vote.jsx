// pages/Vote.jsx - Pairwise comparison voting
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  SearchOff as NotFoundIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  Assessment as ResultsIcon,
} from '@mui/icons-material';

// Hooks and utilities
import { usePoll } from '../hooks/usePoll';
import {
  getDisplayCandidates,
  shouldShowPollDetails
} from '../utils/voteHelpers';

// Components
import API from '../services/api';
import { getFingerprint } from '../utils/fingerprint';
import PollDetails from '../components/PollDetails';
import PairwiseVoteForm, { generateMatchups, matchupKey } from '../components/vote/PairwiseVoteForm';
import { usePageTitle } from '../hooks/usePageTitle';

const Vote = () => {
  const { pollId: urlParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const voterToken = queryParams.get('token');

  // Poll data from custom hook
  const { poll, pollId, loading, error, notFound } = usePoll(urlParam);

  // Local state - pairwise selections keyed by "candId1_vs_candId2"
  // Each value is { cand1: bool, cand2: bool }
  const [pairwiseSelections, setPairwiseSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  // State for existing ballot
  const [existingBallot, setExistingBallot] = useState(null);
  const [loadingBallot, setLoadingBallot] = useState(false);
  const [voterFingerprint, setVoterFingerprint] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  usePageTitle(poll?.title ? `Vote: ${poll.title}` : 'Vote');

  // Check if poll is closed
  const isPollClosed = useMemo(() => {
    if (!poll) return false;
    return poll.status === 'closed' ||
      (poll.closing_at && new Date(poll.closing_at) < new Date());
  }, [poll]);

  // Get candidates for display
  const displayCandidates = useMemo(() => {
    if (!poll?.candidates) return [];
    return getDisplayCandidates(poll.candidates, poll.settings);
  }, [poll]);

  // Total number of matchups
  const totalMatchups = useMemo(() => {
    const n = displayCandidates.length;
    return (n * (n - 1)) / 2;
  }, [displayCandidates]);

  // Count completed matchups (at least one circle filled)
  const completedMatchups = useMemo(() => {
    return Object.values(pairwiseSelections).filter(
      sel => sel.cand1 || sel.cand2
    ).length;
  }, [pairwiseSelections]);

  // Generate fingerprint and check for existing ballot
  useEffect(() => {
    const checkExistingBallot = async () => {
      if (!pollId) return;

      setLoadingBallot(true);
      try {
        // For public polls, generate fingerprint
        let fingerprint = null;
        if (!voterToken) {
          fingerprint = await getFingerprint();
          setVoterFingerprint(fingerprint);
        }

        // Check for existing ballot
        const params = {};
        if (voterToken) {
          params.voter_token = voterToken;
        } else if (fingerprint) {
          params.voter_fingerprint = fingerprint;
        } else {
          return;
        }

        const response = await API.get(`/ballots/${pollId}/ballot`, { params });

        if (response.data.has_voted && response.data.ballot) {
          setIsUpdating(true);
          setExistingBallot(response.data.ballot);

          // Load existing pairwise choices into selections using consistent keys
          if (response.data.ballot.pairwise_choices) {
            const existingSelections = {};
            response.data.ballot.pairwise_choices.forEach(choice => {
              const key = matchupKey(choice.cand1_id, choice.cand2_id);
              // If the key is flipped (cand2 < cand1), swap cand1/cand2 meaning
              const isFlipped = choice.cand2_id < choice.cand1_id;
              if (choice.choice === 'tie' || choice.choice === 'neither') {
                existingSelections[key] = {
                  cand1: choice.choice === 'tie',
                  cand2: choice.choice === 'tie',
                };
              } else if (!isFlipped) {
                existingSelections[key] = {
                  cand1: choice.choice === 'cand1',
                  cand2: choice.choice === 'cand2',
                };
              } else {
                existingSelections[key] = {
                  cand1: choice.choice === 'cand2',
                  cand2: choice.choice === 'cand1',
                };
              }
            });
            setPairwiseSelections(existingSelections);
          }
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error checking for existing ballot:', err);
        }
      } finally {
        setLoadingBallot(false);
      }
    };

    checkExistingBallot();
  }, [voterToken, pollId]);

  // Validation
  const canSubmitBallot = useMemo(() => {
    if (isPollClosed) return false;
    // Must have at least one matchup filled in
    if (completedMatchups === 0) return false;
    // If require_all_matchups, all must be filled
    if (poll?.settings?.require_all_matchups && completedMatchups < totalMatchups) {
      return false;
    }
    return true;
  }, [isPollClosed, completedMatchups, totalMatchups, poll?.settings?.require_all_matchups]);

  // Handle ballot submission
  const handleSubmit = async () => {
    if (isPollClosed) {
      setLocalError('This poll is closed and no longer accepting votes.');
      return;
    }

    if (!canSubmitBallot) {
      if (poll?.settings?.require_all_matchups && completedMatchups < totalMatchups) {
        setLocalError(`You must complete all ${totalMatchups} matchups before submitting.`);
      } else {
        setLocalError('Please make at least one selection before submitting.');
      }
      return;
    }

    setSubmitting(true);
    setLocalError('');

    try {
      // Convert selections to pairwise_choices array — include all matchups
      // The key is always sorted (smaller ID first), and cand1/cand2 in selections
      // refers to the first/second candidate as displayed in the form.
      // matchup.cand1 is the first displayed candidate.
      const allMatchups = generateMatchups(displayCandidates);
      const pairwiseChoices = allMatchups.map((matchup) => {
        const sel = pairwiseSelections[matchup.key] || { cand1: false, cand2: false };
        // In the key, cand1 = smaller ID. In the form, cand1 = matchup.cand1.
        // Check if form order matches key order.
        const isFlipped = matchup.cand1.id > matchup.cand2.id;

        let choice;
        if (sel.cand1 && sel.cand2) {
          choice = 'tie';
        } else if (sel.cand1) {
          // User selected the first displayed candidate (matchup.cand1)
          choice = isFlipped ? 'cand2' : 'cand1';
        } else if (sel.cand2) {
          // User selected the second displayed candidate (matchup.cand2)
          choice = isFlipped ? 'cand1' : 'cand2';
        } else {
          choice = 'neither';
        }
        // Always send with smaller ID as cand1_id for consistency
        const [id1, id2] = matchup.cand1.id < matchup.cand2.id
          ? [matchup.cand1.id, matchup.cand2.id]
          : [matchup.cand2.id, matchup.cand1.id];
        return {
          cand1_id: id1,
          cand2_id: id2,
          choice: choice,
        };
      });

      const ballotData = {
        poll_id: pollId,
        pairwise_choices: pairwiseChoices,
      };

      // Add voter identification
      if (voterToken) {
        ballotData.voter_token = voterToken;
      } else if (voterFingerprint) {
        ballotData.voter_fingerprint = voterFingerprint;
      }

      const response = await API.post('/ballots/', ballotData);

      if (response.data && response.data.success === false && response.data.message === 'Poll is closed') {
        setLocalError('This poll was closed while you were voting. Your vote was not recorded.');
        return;
      }

      setSuccess(true);
      setIsUpdating(true);

      // Navigate to success page
      setTimeout(() => {
        navigate(`/vote-success/${urlParam}`, {
          state: {
            ballotData: ballotData,
            ballotId: response.data.ballot_id,
            success: true
          }
        });
      }, 1500);

    } catch (err) {
      if (err.response?.data?.message === 'Poll is closed') {
        setLocalError('This poll is closed and no longer accepting votes.');
      } else if (err.response?.data?.detail === 'This token has already been used to vote') {
        setLocalError('This voting link has already been used. Each voter can only vote once.');
        setIsUpdating(true);
      } else if (err.response?.data?.detail === 'Invalid voting token') {
        setLocalError('Invalid voting link. Please check that you are using the correct link from your invitation email.');
      } else {
        setLocalError(err.response?.data?.detail || err.message || 'Failed to submit ballot');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading view
  if (loading || loadingBallot) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
            Loading poll...
          </Typography>
        </Container>
      </Box>
    );
  }

  // Not found view
  if (notFound) {
    return (
      <Box sx={{ pt: '160px', pb: 6 }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
            <NotFoundIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Poll Not Found</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Poll with ID "{urlParam}" was not found.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')} size="large">
              Go to Home Page
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Error view
  if (!poll) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  const displayError = localError || error;

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Title */}
          <Box mb={2}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
            >
              {poll.title}
            </Typography>
          </Box>

          {/* Poll Closed Warning */}
          {isPollClosed && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              icon={<LockIcon />}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                This poll is closed
              </Typography>
              <Typography variant="body2">
                {poll.closing_at
                  ? `Voting ended on ${new Date(poll.closing_at).toLocaleDateString()} at ${new Date(poll.closing_at).toLocaleTimeString()}`
                  : 'This poll is no longer accepting votes'}.
              </Typography>
            </Alert>
          )}

          {/* Poll Details */}
          {shouldShowPollDetails(poll) && (
            <PollDetails
              poll={{ ...poll, candidates: displayCandidates.length > 0 ? displayCandidates : poll.candidates }}
              sx={{ mb: 3 }}
            />
          )}

          {/* If poll is closed, show view results button and stop here */}
          {isPollClosed ? (
            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/results/${urlParam}`)}
                startIcon={<ResultsIcon />}
              >
                View Results
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </Box>
          ) : (
            <>
              {/* Voting Instructions */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>How to Vote:</strong>
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                      <li>For each head-to-head matchup, darken the circle next to your preferred candidate</li>
                      <li>You may darken both circles if you have no preference between the two candidates</li>
                      {poll.settings?.require_all_matchups ? (
                        <li><strong>You must complete every matchup</strong></li>
                      ) : (
                        <li>You may leave a matchup blank if you have no opinion</li>
                      )}
                    </ul>
                  </Typography>
                </Box>
              </Alert>

              {/* Error/Success Messages */}
              <Collapse in={displayError !== ''}>
                <Alert severity="error" onClose={() => setLocalError('')} sx={{ mb: 3 }}>
                  {displayError}
                </Alert>
              </Collapse>

              <Collapse in={success}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Vote submitted successfully!
                </Alert>
              </Collapse>

              {/* Update message for returning voters */}
              {isUpdating && !isPollClosed && !submitting && !success && (
                <Alert
                  severity={poll.settings?.allow_vote_updates !== false ? "info" : "warning"}
                  icon={<InfoIcon />}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body2">
                    <strong>You've already voted in this poll.</strong>
                    {poll.settings?.allow_vote_updates !== false ? (
                      <>
                        {' '}You can update your vote below.
                        {existingBallot?.updated_at && (
                          <> Last updated: {new Date(existingBallot.updated_at).toLocaleString()}</>
                        )}
                      </>
                    ) : (
                      <> Vote updates are not allowed for this poll. Your original vote has been recorded.</>
                    )}
                  </Typography>
                </Alert>
              )}

              {/* Matchup counter */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 3 }}>
                <Chip
                  label={`${completedMatchups} of ${totalMatchups} matchups completed`}
                  color={poll.settings?.require_all_matchups && completedMatchups < totalMatchups ? 'warning' : 'primary'}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Pairwise Vote Form */}
              <Box sx={{ mt: 1 }}>
                <PairwiseVoteForm
                  candidates={displayCandidates}
                  selections={pairwiseSelections}
                  onSelectionChange={setPairwiseSelections}
                  disabled={submitting || success || (isUpdating && poll.settings?.allow_vote_updates === false)}
                />

                {/* Submit Button */}
                <Box display="flex" justifyContent="center" mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={!canSubmitBallot || submitting || success || (isUpdating && poll.settings?.allow_vote_updates === false)}
                    startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
                    fullWidth
                    sx={{ maxWidth: '100%' }}
                  >
                    {submitting ? 'Submitting...' : (isUpdating ? 'Update Vote' : 'Submit Vote')}
                  </Button>
                </Box>

                {/* Validation message for require_all_matchups */}
                {poll.settings?.require_all_matchups && completedMatchups > 0 && completedMatchups < totalMatchups && (
                  <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
                    <Typography variant="body2">
                      Please complete all {totalMatchups} matchups before submitting. You have completed {completedMatchups}.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Vote;
