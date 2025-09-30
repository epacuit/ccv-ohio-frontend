// pages/Vote.jsx - Complete file with token support
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
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { 
  Send as SendIcon, 
  SearchOff as NotFoundIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon,
  Lock as LockIcon,
  Assessment as ResultsIcon,
  Check as CheckCircleIcon,
} from '@mui/icons-material';

// Hooks and utilities
import { usePoll } from '../hooks/usePoll';
import { 
  formatBallotData, 
  getDisplayCandidates,
  shouldShowPollDetails 
} from '../utils/voteHelpers';
import { 
  validateBallotForSubmission,
  getEffectiveBallot,
  canShowMatchups
} from '../utils/ballotValidation';
import { 
  BALLOT_PROCESSING_RULES
} from '../utils/ballotProcessingRules';

// Components
import API from '../services/api';
import PollDetails from '../components/PollDetails';
import VoteInputTable from '../components/vote/VoteInputTable';
import VotingMatchups from '../components/vote/VotingMatchups';
import WriteInSection from '../components/vote/WriteInSection';

const Vote = () => {
  const { pollId: urlParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const voterToken = queryParams.get('token');
  
  // Poll data from custom hook
  const { poll, pollId, loading, error, notFound } = usePoll(urlParam);
  
  // Local state
  const [tableSelections, setTableSelections] = useState({});
  const [userWriteIns, setUserWriteIns] = useState([]); // Per-voter write-ins
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState('');
  const [hideUnranked, setHideUnranked] = useState(false);
  
  // State for existing ballot (for private polls with tokens)
  const [existingBallot, setExistingBallot] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loadingBallot, setLoadingBallot] = useState(false);
  
  // Check if poll is closed
  const isPollClosed = useMemo(() => {
    if (!poll) return false;
    return poll.status === 'closed' || 
      (poll.closing_at && new Date(poll.closing_at) < new Date());
  }, [poll]);
  
  // Check for existing ballot if token is provided
  useEffect(() => {
    const checkExistingBallot = async () => {
      if (!voterToken || !pollId) return;
      
      setLoadingBallot(true);
      try {
        const response = await API.get('/ballots/check', {
          params: {
            poll_id: pollId,
            voter_token: voterToken
          }
        });
        
        if (response.data.has_voted && response.data.ballot) {
          setHasVoted(true);
          setExistingBallot(response.data.ballot);
          
          // Load the existing ballot into tableSelections
          const existingSelections = {};
          response.data.ballot.rankings.forEach(ranking => {
            existingSelections[ranking.candidate_id] = ranking.rank;
          });
          setTableSelections(existingSelections);
          
          // Load any write-ins from the existing ballot
          if (response.data.ballot.write_ins) {
            setUserWriteIns(response.data.ballot.write_ins);
          }
        }
      } catch (err) {
        console.error('Error checking for existing ballot:', err);
        // Don't show error - just proceed as normal voting
      } finally {
        setLoadingBallot(false);
      }
    };
    
    checkExistingBallot();
  }, [voterToken, pollId]);
  
  // Combine poll candidates with user's write-ins for display
  const displayCandidates = useMemo(() => {
    if (!poll?.candidates) return [];
    
    const pollCandidates = getDisplayCandidates(poll.candidates, poll.settings);
    
    // Add user's write-ins to the display list
    return [...pollCandidates, ...userWriteIns];
  }, [poll, userWriteIns]);
  
  // Get num_ranks from poll settings (defaults to number of candidates if not set)
  const numRanks = useMemo(() => {
    if (poll?.settings?.num_ranks !== undefined && poll?.settings?.num_ranks !== null) {
      return poll.settings.num_ranks;
    }
    // Default to all candidates if not specified
    return poll?.candidates?.length || 0;
  }, [poll]);
  
  // Calculate max allowed ranks (num_ranks + write-ins count)
  const maxAllowedRanks = numRanks + userWriteIns.length;
  
  // Filter candidates based on hideUnranked state
  const visibleCandidates = useMemo(() => {
    if (!hideUnranked) return displayCandidates;
    
    // Only show candidates that have been ranked
    return displayCandidates.filter(candidate => 
      tableSelections[candidate.id] !== undefined && 
      tableSelections[candidate.id] !== null &&
      tableSelections[candidate.id] !== ''
    );
  }, [displayCandidates, tableSelections, hideUnranked]);
  
  // Handle adding write-in candidate
  const handleAddWriteIn = (newWriteIn) => {
    setUserWriteIns(prev => [...prev, newWriteIn]);
  };
  
  // Handle removing write-in candidate
  const handleRemoveWriteIn = (writeInId) => {
    // Remove from write-ins list
    setUserWriteIns(prev => prev.filter(writeIn => writeIn.id !== writeInId));
    
    // Remove any rankings for this write-in
    setTableSelections(prev => {
      const updated = { ...prev };
      delete updated[writeInId];
      return updated;
    });
  };
  
  // Enhanced validation with num_ranks check
  const ballotValidation = useMemo(() => {
    // First get standard validation
    const baseValidation = validateBallotForSubmission(tableSelections, displayCandidates, poll?.settings);
    
    // Count ranked candidates (excluding nulls and empty strings)
    const rankedCount = Object.values(tableSelections).filter(
      rank => rank !== null && rank !== undefined && rank !== ''
    ).length;
    
    // Check if exceeds max allowed ranks
    if (rankedCount > maxAllowedRanks) {
      return {
        ...baseValidation,
        canSubmit: false,
        processingLevel: 'invalid',
        errors: [
          `You can only rank up to ${numRanks} candidate${numRanks === 1 ? '' : 's'}` +
          (userWriteIns.length > 0 ? ` (plus ${userWriteIns.length} write-in${userWriteIns.length === 1 ? '' : 's'})` : '') +
          `. You have ranked ${rankedCount}.`
        ]
      };
    }
    
    return baseValidation;
  }, [tableSelections, displayCandidates, poll?.settings, numRanks, maxAllowedRanks, userWriteIns.length]);
  
  // Get effective ballot for display (handles truncation)
  const effectiveBallot = useMemo(() => {
    return getEffectiveBallot(tableSelections, ballotValidation);
  }, [tableSelections, ballotValidation]);
  
  // Determine if we can submit and show matchups (DISABLED if poll is closed or already voted)
  const canSubmitBallot = !isPollClosed && !hasVoted && ballotValidation.canSubmit && Object.keys(tableSelections).length > 0;
  const shouldShowMatchupsForBallot = canShowMatchups(tableSelections, displayCandidates, poll?.settings?.ballot_processing_rule || BALLOT_PROCESSING_RULES.ALASKA);
  
  // Handle ballot submission
  const handleSubmit = async () => {
    // Additional checks
    if (isPollClosed) {
      setLocalError('This poll is closed and no longer accepting votes.');
      return;
    }
    
    if (hasVoted) {
      setLocalError('You have already voted in this poll.');
      return;
    }
    
    if (!canSubmitBallot) {
      setLocalError('Cannot submit ballot: ' + (ballotValidation.errors[0] || 'Invalid ballot'));
      return;
    }
    
    setSubmitting(true);
    setLocalError('');
    
    try {
      // Create ballot data with consistent candidate_id usage
      const ballotData = {
        poll_id: pollId,
        rankings: Object.entries(effectiveBallot)
          .filter(([candidateId, rank]) => rank !== null && rank !== undefined)
          .map(([candidateId, rank]) => ({
            candidate_id: candidateId,
            rank: rank
          }))
      };
      
      // Add voter token if this is a private poll
      if (voterToken) {
        ballotData.voter_token = voterToken;
      }
      
      // Add write-ins to the ballot data if any exist
      if (userWriteIns.length > 0) {
        ballotData.write_ins = userWriteIns;
      }
      
      console.log('Ballot data being submitted:', ballotData);
      
      const response = await API.post('/ballots/', ballotData);
      
      // Check if the backend says poll is closed
      if (response.data && response.data.success === false && response.data.message === 'Poll is closed') {
        setLocalError('This poll was closed while you were voting. Your vote was not recorded.');
        return;
      }
      
      setSuccess(true);
      setHasVoted(true); // Mark as voted after successful submission
      
      // Navigate to success page with ballot data
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
        setHasVoted(true);
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
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
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
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <NotFoundIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h4" gutterBottom>Poll Not Found</Typography>
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
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }
  
  // Determine if we should show matchups at all - ALWAYS for 2-5 candidates
  const shouldShowMatchups = displayCandidates && 
    displayCandidates.length >= 2 && 
    displayCandidates.length <= 5;
  
  const displayError = localError || error;
  
  // Determine what validation message to show
  const renderValidationMessage = () => {
    if (!ballotValidation || Object.keys(tableSelections).length === 0) return null;
    
    // Case 1: Invalid ballot (cannot process)
    if (ballotValidation.processingLevel === 'invalid') {
      return (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Cannot Be Processed
          </Typography>
          {ballotValidation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 2: Incomplete ballot (complete ranking required)
    if (ballotValidation.processingLevel === 'incomplete') {
      return (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Complete Your Ballot
          </Typography>
          {ballotValidation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 3: Truncated ballot
    if (ballotValidation.processingLevel === 'truncated') {
      return (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Will Be Truncated
          </Typography>
          {ballotValidation.warnings.map((warning, index) => (
            <Typography key={index} variant="body2">
              {warning}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    // Case 4: Warning (with processing notes)
    if (ballotValidation.processingLevel === 'warning') {
      return (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mt: 3 }}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Ballot Processing Notes
          </Typography>
          {ballotValidation.warnings.map((warning, index) => (
            <Typography key={index} variant="body2" sx={{ mb: index < ballotValidation.warnings.length - 1 ? 1 : 0 }}>
              {warning}
            </Typography>
          ))}
        </Alert>
      );
    }
    
    return null;
  };
  
  // Count ranked candidates for display
  const rankedCount = Object.values(tableSelections).filter(
    rank => rank !== null && rank !== undefined && rank !== ''
  ).length;
  
  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
          {/* Title */}
          <Box mb={2}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
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
          
          {/* Already Voted Warning for Private Polls */}
          {hasVoted && voterToken && !isPollClosed && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={<CheckCircleIcon />}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                You have already voted in this poll
              </Typography>
              <Typography variant="body2" gutterBottom>
                Your vote has been recorded. Below is your submitted ballot for reference.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Note: In private polls, each voter can only vote once. Your ballot cannot be changed after submission.
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
              {/* Voting Rules with num_ranks info */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Voting Rules:</strong>
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                      <li>Rank candidates in order of preference</li>
                      
                      {/* Num ranks limit */}
                      {numRanks < poll.candidates.length && (
                        <li>
                          <strong>You can rank up to {numRanks} candidate{numRanks === 1 ? '' : 's'}</strong>
                          {poll.settings?.allow_write_in && ' (plus any write-ins you add)'}
                        </li>
                      )}
                      
                      {/* Rules based on processing type */}
                      {ballotValidation.ruleType === BALLOT_PROCESSING_RULES.ALASKA ? (
                        <li>Skipped ranks may affect how pairwise comparisons are determined</li>
                      ) : (
                        <>
                          <li>Ballots are automatically truncated after 2+ consecutive skipped ranks</li>
                          <li>Single skipped ranks are allowed but noted</li>
                        </>
                      )}
                      
                      {/* Complete ranking requirement */}
                      {poll.settings?.require_complete_ranking ? (
                        <li>You must rank all {Math.min(numRanks, displayCandidates.length)} candidate{Math.min(numRanks, displayCandidates.length) === 1 ? '' : 's'}</li>
                      ) : (
                        <li>You don't need to rank all candidates</li>
                      )}
                      
                      {/* Ties setting */}
                      {poll.settings?.allow_ties ? (
                        <li>You can rank multiple candidates equally (ties allowed)</li>
                      ) : (
                        <li>Each candidate must have a unique rank (no ties)</li>
                      )}
                      
                      {/* Write-in setting */}
                      {poll.settings?.allow_write_in && <li>You can add write-in candidates to your ballot</li>}
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
                  Ballot submitted successfully! Redirecting to results...
                </Alert>
              </Collapse>
              
              {/* Write-in Section - disabled if already voted */}
              {poll.settings?.allow_write_in && !hasVoted && (
                <WriteInSection
                  candidates={poll.candidates || []}
                  existingWriteIns={userWriteIns}
                  onAddWriteIn={handleAddWriteIn}
                  onError={setLocalError}
                  disabled={submitting || success || hasVoted}
                />
              )}
              
              {/* Hide/Show Unranked Toggle and Rank Counter */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                mt: 3 
              }}>
                {/* Rank counter - only show when num_ranks limits the selection */}
                {numRanks < poll.candidates.length && (
                  <Chip
                    label={`${rankedCount} of ${maxAllowedRanks} ranks used`}
                    color={rankedCount > maxAllowedRanks ? 'error' : 'primary'}
                    variant="outlined"
                    size="small"
                  />
                )}
                
                {/* If no rank limit, just add a spacer */}
                {numRanks >= poll.candidates.length && <Box />}
                
                {/* Hide/Show toggle */}
                <Button
                  size="small"
                  startIcon={hideUnranked ? <ShowIcon /> : <HideIcon />}
                  onClick={() => setHideUnranked(!hideUnranked)}
                  sx={{ 
                    textTransform: 'none',
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {hideUnranked ? 'Show All Candidates' : 'Hide Unranked'}
                </Button>
              </Box>
              
              {/* Voting Interface WITH Matchups (2-5 candidates) */}
              {shouldShowMatchups ? (
                <Box sx={{ 
                  mt: 3,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
                  gap: 3,
                }}>
                  <Box>
                    {/* 1. Vote INPUT Table */}
                    <VoteInputTable
                      candidates={visibleCandidates}
                      allCandidates={displayCandidates}
                      selections={tableSelections}
                      onSelectionChange={setTableSelections}
                      settings={poll.settings}
                      onRemoveWriteIn={handleRemoveWriteIn}
                      numRanks={numRanks}
                      maxAllowedRanks={maxAllowedRanks}
                      hideUnranked={hideUnranked}
                      disabled={hasVoted} // Disable if already voted
                    />
                    
                    {/* 2. Submit Button directly under input table */}
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        disabled={!canSubmitBallot || submitting || success || hasVoted}
                        startIcon={hasVoted ? <CheckCircleIcon /> : <SendIcon />}
                        fullWidth
                      >
                        {hasVoted ? 'Already Voted' : submitting ? 'Submitting...' : 'Submit Ballot'}
                      </Button>
                    </Box>
                    
                    {/* 3. Validation Message (if any) */}
                    {renderValidationMessage()}
                  </Box>
                  
                  {/* Matchups display - only show determined comparisons */}
                  <VotingMatchups
                    candidates={displayCandidates}
                    tableSelections={shouldShowMatchupsForBallot ? effectiveBallot : {}}
                    processingRule={poll?.settings?.ballot_processing_rule || BALLOT_PROCESSING_RULES.ALASKA}
                  />
                </Box>
              ) : (
                /* Voting Interface WITHOUT Matchups (1 candidate or 6+ candidates) */
                <Box sx={{ mt: 3 }}>
                  {/* 1. Vote INPUT Table */}
                  <VoteInputTable
                    candidates={visibleCandidates}
                    allCandidates={displayCandidates}
                    selections={tableSelections}
                    onSelectionChange={setTableSelections}
                    settings={poll.settings}
                    onRemoveWriteIn={handleRemoveWriteIn}
                    numRanks={numRanks}
                    maxAllowedRanks={maxAllowedRanks}
                    hideUnranked={hideUnranked}
                    disabled={hasVoted} // Disable if already voted
                  />
                  
                  {/* 2. Submit Button directly under input table */}
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={!canSubmitBallot || submitting || success || hasVoted}
                      startIcon={hasVoted ? <CheckCircleIcon /> : <SendIcon />}
                      fullWidth
                      sx={{ maxWidth: '100%' }}
                    >
                      {hasVoted ? 'Already Voted' : submitting ? 'Submitting...' : 'Submit Ballot'}
                    </Button>
                  </Box>
                  
                  {/* 3. Validation Message (if any) */}
                  {renderValidationMessage()}
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Vote;