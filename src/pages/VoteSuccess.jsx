// pages/VoteSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Link
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

// Hooks and utilities
import { usePoll } from '../hooks/usePoll';
import ReadOnlyVotingTable from '../components/vote/ReadOnlyVotingTable';
import API from '../services/api';

const VoteSuccess = () => {
  const { pollId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get ballot data from navigation state
  const ballotData = location.state?.ballotData;
  const ballotId = location.state?.ballotId;
  
  // Debug logging to see what we actually received
  React.useEffect(() => {
    console.log('=== RECEIVED IN VOTESUCCESS ===');
    console.log('location.state:', location.state);
    console.log('ballotData received:', ballotData);
    console.log('ballotData.rankings received:', ballotData?.rankings);
    console.log('ballotData JSON received:', JSON.stringify(ballotData, null, 2));
  }, [ballotData]);
  
  // Poll data
  const { poll, loading: pollLoading, error: pollError } = usePoll(pollId);
  
  // Local state
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [copied, setCopied] = useState(false);

  // Redirect if no ballot data
  useEffect(() => {
    if (!ballotData && !location.state) {
      navigate(`/vote/${pollId}`, { replace: true });
    }
  }, [ballotData, location.state, navigate, pollId]);

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!ballotId) {
      setPdfError('Ballot ID not available for PDF generation');
      return;
    }

    setDownloadingPdf(true);
    setPdfError('');

    try {
      const response = await API.get(`/ballots/${ballotId}/pdf`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ballot_${pollId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setPdfError(err.response?.data?.detail || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle view results
  const handleViewResults = () => {
    navigate(`/results/${pollId}`);
  };

  // Handle go home
  const handleGoHome = () => {
    navigate('/');
  };

  // Handle copy link
  const handleCopyLink = () => {
    const resultsLink = `${window.location.origin}/results/${pollId}`;
    navigator.clipboard.writeText(resultsLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  // Loading state
  if (pollLoading) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
        </Container>
      </Box>
    );
  }

  // Error state
  if (pollError || !poll) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error">
            {pollError || 'Poll not found'}
          </Alert>
        </Container>
      </Box>
    );
  }

  // No ballot data - shouldn't happen due to redirect
  if (!ballotData) {
    return null;
  }

  // Reconstruct selections object for ReadOnlyVotingTable
  const selections = {};
  
  console.log('=== VoteSuccess Debug ===');
  console.log('ballotData:', ballotData);
  console.log('ballotData.rankings:', ballotData.rankings);
  
  if (ballotData.rankings) {
    ballotData.rankings.forEach(ranking => {
      console.log('Processing ranking:', ranking);
      // Use candidate_id - backend now transforms properly
      const candidateId = ranking.candidate_id;
      if (candidateId) {
        selections[candidateId] = ranking.rank;
        console.log(`Set selections[${candidateId}] = ${ranking.rank}`);
      } else {
        console.error('Missing candidate_id in ranking:', ranking);
      }
    });
  }
  
  console.log('Final selections object:', selections);

  // Combine poll candidates with write-ins for display
  const displayCandidates = [...(poll.candidates || [])];
  if (ballotData.write_ins) {
    displayCandidates.push(...ballotData.write_ins);
  }

  // Determine if user can view results
  const canViewResults = poll.settings?.allow_results_viewing !== false;

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          
          {/* Success Icon */}
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: 'success.main', 
              mb: 3 
            }} 
          />
          
          {/* Success Message */}
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Vote Submitted Successfully!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Thank you for participating in "{poll.title}". Your ballot has been recorded.
          </Typography>

          {/* Read-only Ballot Display */}
          <Box sx={{ mb: 4 }}>
            <ReadOnlyVotingTable
              candidates={displayCandidates}
              selections={selections}
              title="Your Ballot"
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto' }}>
            
            {/* View Results Button - First, with gray background */}
            {canViewResults && (
              <Button
                variant="contained"
                size="large"
                startIcon={<ViewIcon />}
                onClick={handleViewResults}
                fullWidth
                sx={{
                  backgroundColor: 'grey.300',
                  color: 'grey.900',
                  '&:hover': {
                    backgroundColor: 'grey.400'
                  }
                }}
              >
                View Results
              </Button>
            )}
            
            {/* Update Vote Button - Second, if updates are allowed */}
            {poll.settings?.allow_vote_updates !== false && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(`/vote/${pollId}`)}
                fullWidth
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                Update My Vote
              </Button>
            )}

            {/* Download PDF Button - Third, outlined style */}
            <Button
              variant="outlined"
              size="large"
              startIcon={downloadingPdf ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || !ballotId}
              fullWidth
            >
              {downloadingPdf ? 'Generating PDF...' : 'Download Ballot PDF'}
            </Button>

            {/* PDF Error */}
            {pdfError && (
              <Alert severity="error" sx={{ textAlign: 'left' }}>
                {pdfError}
              </Alert>
            )}

            {/* Go Home Button - Last */}
            <Button
              variant="text"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              fullWidth
            >
              Return to Home
            </Button>
          </Box>

          {/* Additional Info */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" paragraph>
              Your vote is anonymous and secure. You can download a PDF copy of your ballot for your records.
            </Typography>
            
            {/* Results Link for Recording */}
            {canViewResults && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1, position: 'relative' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Results Link (for your records):
                </Typography>
                
                {/* Copy Button in upper right */}
                <IconButton
                  onClick={handleCopyLink}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    '&:hover': {
                      backgroundColor: 'grey.200'
                    }
                  }}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
                
                {/* Copied feedback */}
                {copied && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      position: 'absolute',
                      top: 8,
                      right: 45,
                      color: 'success.main',
                      fontWeight: 'bold'
                    }}
                  >
                    Copied!
                  </Typography>
                )}
                
                {/* Clickable Link */}
                <Link
                  href={`${window.location.origin}/results/${pollId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.875rem',
                    wordBreak: 'break-all',
                    display: 'block',
                    textDecoration: 'underline',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {window.location.origin}/results/{pollId}
                </Link>
              </Box>
            )}
          </Box>

        </Paper>
      </Container>
    </Box>
  );
};

export default VoteSuccess;