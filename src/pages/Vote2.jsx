import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Collapse,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Send as SendIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  SearchOff as NotFoundIcon,
} from '@mui/icons-material';
import API from '../services/api';
import PollDetails from '../components/PollDetails';
import { POLL_SLUGS } from '../constants/pollMappings';


// Custom styled checkbox to look like ballot circles
const BallotMark = ({ checked, onChange, candidateId, rank }) => {
  return (
    <Box
      onClick={onChange}
      data-testid={`ballot-mark-${candidateId}-${rank}`}
      role="checkbox"
      aria-checked={checked}
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: 'text.secondary',
        backgroundColor: checked ? '#1a1a1a' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: checked ? '#1a1a1a' : 'action.hover',
        },
        // Add slight texture/irregularity to mimic hand-drawn fill
        '&::after': checked ? {
          content: '""',
          position: 'absolute',
          top: '2px',
          left: '2px',
          right: '2px',
          bottom: '2px',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          opacity: 0.9,
          transform: 'scale(0.95)',
        } : {},
      }}
    />
  );
};

const Vote = () => {
  const { pollId: urlParam } = useParams();
  const navigate = useNavigate();
  const pollingInterval = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tableSelections, setTableSelections] = useState({}); // {candidateId: rank}
  const [displayCandidates, setDisplayCandidates] = useState([]); // Randomized candidates
  const [writeInValue, setWriteInValue] = useState('');
  const [addingWriteIn, setAddingWriteIn] = useState(false);
  
  // Map the slug to actual ID if it exists in our mappings
  const pollId = POLL_SLUGS[urlParam] || urlParam;

  // Load poll data
  useEffect(() => {
    loadPoll();
  }, [pollId]);
  
  // Set up polling for updates if write-ins are enabled
  useEffect(() => {
    if (poll?.settings?.allow_write_in) {
      // Poll every 3 seconds for updates to catch new write-ins
      pollingInterval.current = setInterval(() => {
        loadPoll();
      }, 3000);
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [poll?.settings?.allow_write_in]);
  
  // Randomize candidates if setting is enabled
  useEffect(() => {
    if (poll && poll.options) {
      if (poll.settings?.randomize_options) {
        // Fisher-Yates shuffle
        const shuffled = [...poll.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setDisplayCandidates(shuffled);
      } else {
        setDisplayCandidates(poll.options);
      }
    }
  }, [poll]);
  
  const loadPoll = async () => {
    try {
      const response = await API.get(`/polls/${pollId}`);
      setPoll(response.data);
      setLoading(false);
      setNotFound(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError('Failed to load poll. Please check the link and try again.');
      }
      setLoading(false);
    }
  };
  
  const handleAddWriteIn = async () => {
    if (!writeInValue.trim()) {
      setError('Please enter a candidate name');
      return;
    }
    
    setAddingWriteIn(true);
    setError('');
    
    try {
      await API.post(`/polls/${pollId}/write-ins`, {
        name: writeInValue.trim(),
      });
      
      setWriteInValue('');
      
      // Refresh poll data to get the updated options
      await loadPoll();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add write-in candidate');
    } finally {
      setAddingWriteIn(false);
    }
  };
  
  // Check if poll details should be shown
  const shouldShowPollDetails = () => {
    if (poll?.description) return true;
    if (poll?.options?.some(opt => opt.description || opt.image_url)) return true;
    return false;
  };
  
  // Table interface handlers
  const handleTableSelection = (candidateId, rank) => {
    setTableSelections(prev => {
      const newSelections = { ...prev };
      
      // If ties are not allowed, check if this rank is already assigned
      if (!poll.settings?.allow_ties) {
        // Remove any existing selection for this rank
        Object.keys(newSelections).forEach(id => {
          if (newSelections[id] === rank && id !== candidateId) {
            delete newSelections[id];
          }
        });
      }
      
      // If clicking the same rank, toggle it off
      if (newSelections[candidateId] === rank) {
        delete newSelections[candidateId];
      } else {
        newSelections[candidateId] = rank;
      }
      
      return newSelections;
    });
  };
  
  // Validate ballot before submission
  const validateBallot = () => {
    const rankings = Object.entries(tableSelections);
    const totalCandidates = displayCandidates.length;
    
    // Check if at least one candidate is ranked
    if (rankings.length === 0) {
      throw new Error('Please rank at least one candidate');
    }
    
    // Check if all candidates are ranked (if required)
    if (poll.settings?.require_complete_ranking && rankings.length < totalCandidates) {
      throw new Error(`This poll requires you to rank all ${totalCandidates} candidates`);
    }
    
    // Check for ties (if not allowed)
    if (!poll.settings?.allow_ties) {
      const rankCounts = {};
      rankings.forEach(([_, rank]) => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
      });
      
      const hasTies = Object.values(rankCounts).some(count => count > 1);
      if (hasTies) {
        throw new Error('This poll does not allow ties. Each candidate must have a unique rank.');
      }
    }
    
    return true;
  };
  
  // Submit ballot
  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      // Validate ballot
      validateBallot();
      
      // Prepare rankings from table selections
      const rankings = Object.entries(tableSelections).map(([candidateId, rank]) => ({
        option_id: candidateId,
        rank: rank
      }));
      
      const ballotData = {
        poll_id: pollId,
        rankings: rankings,
      };
      
      await API.post('/ballots/submit', ballotData);
      setSuccess(true);
      
      // Redirect to results after 2 seconds
      setTimeout(() => {
        navigate(`/results/${urlParam}`);
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit ballot');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
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
  
  if (!poll) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
    
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <VoteIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h3" component="h1">
              {poll.title}
            </Typography>
            {poll.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {poll.description}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Poll Details - Only show if needed */}
        {shouldShowPollDetails() && (
          <PollDetails 
            poll={{
              ...poll,
              options: displayCandidates
            }} 
            sx={{ mb: 4 }} 
          />
        )}

        {/* Voting Rules */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="body2" gutterBottom>
              <strong>Voting Rules:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                <li>Rank candidates in order of preference</li>
                {poll.settings?.allow_ties && <li>You can rank multiple candidates equally (ties allowed)</li>}
                {!poll.settings?.allow_ties && <li>Each candidate must have a unique rank (no ties)</li>}
                {!poll.settings?.require_complete_ranking && <li>You don't need to rank all candidates</li>}
                {poll.settings?.require_complete_ranking && <li>You must rank all candidates</li>}
                {poll.settings?.allow_write_in && <li>You can add write-in candidates</li>}
              </ul>
            </Typography>
          </Box>
        </Alert>
        
        <Collapse in={error !== ''}>
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Collapse>
        
        <Collapse in={success}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Ballot submitted successfully! Redirecting to results...
          </Alert>
        </Collapse>
        
        {/* Write-in Section */}
        {poll.settings?.allow_write_in && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Write-in Candidate
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                value={writeInValue}
                onChange={(e) => setWriteInValue(e.target.value)}
                placeholder="Enter candidate name"
                variant="outlined"
                size="small"
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddWriteIn();
                  }
                }}
                disabled={addingWriteIn}
              />
              <Button
                variant="contained"
                onClick={handleAddWriteIn}
                disabled={addingWriteIn || !writeInValue.trim()}
                startIcon={addingWriteIn ? <CircularProgress size={20} /> : <PersonAddIcon />}
              >
                Add
              </Button>
            </Box>
            {poll.options.filter(opt => opt.is_write_in).length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {poll.options.filter(opt => opt.is_write_in).length} write-in candidate{poll.options.filter(opt => opt.is_write_in).length !== 1 ? 's' : ''} added
              </Typography>
            )}
          </Box>
        )}
        
        {/* Table Interface */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Click to assign ranks to candidates
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {poll.settings?.allow_ties 
              ? 'Multiple candidates can share the same rank to indicate ties'
              : 'Select one rank per candidate - each candidate must have a unique rank'
            }
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', fontSize: '1.1rem' }}>
                    Candidate
                  </TableCell>
                  {[...Array(displayCandidates.length)].map((_, i) => (
                    <TableCell 
                      key={i} 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold', 
                        backgroundColor: 'primary.main', 
                        color: 'white',
                        minWidth: 60,
                        textAlign: 'center',
                        fontSize: '1.1rem'
                      }}
                    >
                      {i + 1}
                      {i === 0 && 'st'}
                      {i === 1 && 'nd'}
                      {i === 2 && 'rd'}
                      {i > 2 && 'th'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayCandidates.map((candidate, idx) => (
                  <TableRow 
                    key={candidate.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography>{candidate.name}</Typography>
                        {candidate.is_write_in && (
                          <Chip label="Write-in" size="small" color="info" />
                        )}
                      </Box>
                    </TableCell>
                    {[...Array(displayCandidates.length)].map((_, i) => (
                      <TableCell key={i} align="center" sx={{ textAlign: 'center' }}>
                        <Box display="flex" justifyContent="center" alignItems="center">
                          <BallotMark
                            checked={tableSelections[candidate.id] === i + 1}
                            onChange={() => handleTableSelection(candidate.id, i + 1)}
                            candidateId={candidate.id}
                            rank={i + 1}
                          />
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Current Selection Summary */}
          {Object.keys(tableSelections).length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Your current ranking:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(
                  Object.entries(tableSelections).reduce((acc, [candidateId, rank]) => {
                    if (!acc[rank]) acc[rank] = [];
                    acc[rank].push(candidateId);
                    return acc;
                  }, {})
                )
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([rank, candidateIds]) => (
                    <Chip
                      key={rank}
                      label={`Rank ${rank}: ${candidateIds
                        .map(id => displayCandidates.find(opt => opt.id === id)?.name)
                        .join(' = ')}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Submit Button */}
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={<SendIcon />}
          >
            {submitting ? 'Submitting...' : 'Submit Ballot'}
          </Button>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
};

export default Vote;