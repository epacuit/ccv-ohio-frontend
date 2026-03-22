// pages/VoteSuccess.jsx - Pairwise comparison success page
import React, { useEffect, useState, useMemo } from 'react';
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
  Link,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  ContentCopy as ContentCopyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

// Hooks and utilities
import { usePoll } from '../hooks/usePoll';
import PairwiseVoteForm, { generateMatchups, matchupKey } from '../components/vote/PairwiseVoteForm';
import API from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

const VoteSuccess = () => {
  usePageTitle('Vote Submitted');
  const { pollId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get ballot data from navigation state
  const ballotData = location.state?.ballotData;
  const ballotId = location.state?.ballotId;

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

  // Reconstruct pairwise selections from ballotData for display
  const pairwiseSelections = useMemo(() => {
    if (!ballotData?.pairwise_choices) return {};

    const selections = {};
    ballotData.pairwise_choices.forEach((choice) => {
      const key = matchupKey(choice.cand1_id, choice.cand2_id);
      const isFlipped = choice.cand2_id < choice.cand1_id;
      if (choice.choice === 'tie' || choice.choice === 'neither') {
        selections[key] = {
          cand1: choice.choice === 'tie',
          cand2: choice.choice === 'tie',
        };
      } else if (!isFlipped) {
        selections[key] = {
          cand1: choice.choice === 'cand1',
          cand2: choice.choice === 'cand2',
        };
      } else {
        selections[key] = {
          cand1: choice.choice === 'cand2',
          cand2: choice.choice === 'cand1',
        };
      }
    });
    return selections;
  }, [ballotData]);

  // Calculate summary stats
  const ballotSummary = useMemo(() => {
    if (!poll?.candidates || !ballotData?.pairwise_choices) return null;

    const matchups = generateMatchups(poll.candidates);
    const totalMatchups = matchups.length;
    const submittedChoices = ballotData.pairwise_choices;

    let ties = 0;
    let blanks = 0;

    // Count ties
    submittedChoices.forEach((choice) => {
      if (choice.choice === 'tie') ties++;
    });

    // Count blanks (matchups not in submitted choices)
    const submittedKeys = new Set(
      submittedChoices.map((c) => `${c.cand1_id}_vs_${c.cand2_id}`)
    );
    matchups.forEach((m) => {
      if (!submittedKeys.has(m.key)) blanks++;
    });

    return { totalMatchups, ties, blanks };
  }, [poll, ballotData]);

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
        responseType: 'blob',
      });

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

  const handleCopyLink = () => {
    const resultsLink = `${window.location.origin}/results/${pollId}`;
    navigator.clipboard.writeText(resultsLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Loading state
  if (pollLoading) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
        </Container>
      </Box>
    );
  }

  // Error state
  if (pollError || !poll) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert severity="error">{pollError || 'Poll not found'}</Alert>
        </Container>
      </Box>
    );
  }

  if (!ballotData) {
    return null;
  }

  const canViewResults = poll.settings?.allow_results_viewing !== false;
  const canUpdate = poll.settings?.allow_vote_updates !== false;

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>

          {/* Success Icon */}
          <CheckCircleIcon
            sx={{ fontSize: 80, color: 'success.main', mb: 3 }}
          />

          {/* Success Message */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Vote Submitted Successfully!
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            Thank you for participating in "{poll.title}". Your ballot has been recorded.
          </Typography>

          {/* Notes about ties and blanks */}
          {ballotSummary && (ballotSummary.ties > 0 || ballotSummary.blanks > 0) && (
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{ mb: 3, textAlign: 'left' }}
            >
              {ballotSummary.ties > 0 && (
                <Typography variant="body2" sx={{ mb: ballotSummary.blanks > 0 ? 1 : 0 }}>
                  You selected both candidates in {ballotSummary.ties} matchup{ballotSummary.ties !== 1 ? 's' : ''}, indicating no preference.
                </Typography>
              )}
              {ballotSummary.blanks > 0 && (
                <Typography variant="body2">
                  You left {ballotSummary.blanks} matchup{ballotSummary.blanks !== 1 ? 's' : ''} blank.
                </Typography>
              )}
              {canUpdate && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                  You can update your ballot at any time if you'd like to change your selections.
                </Typography>
              )}
            </Alert>
          )}

          {/* Read-only Pairwise Ballot Display */}
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
              Your Ballot
            </Typography>
            <PairwiseVoteForm
              candidates={poll.candidates || []}
              selections={pairwiseSelections}
              readOnly
              disabled
            />
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto' }}>

            {/* View Results Button */}
            {canViewResults && (
              <Button
                variant="contained"
                size="large"
                startIcon={<ViewIcon />}
                onClick={() => navigate(`/results/${pollId}`)}
                fullWidth
                sx={{
                  backgroundColor: 'grey.300',
                  color: 'grey.900',
                  '&:hover': { backgroundColor: 'grey.400' },
                }}
              >
                View Results
              </Button>
            )}

            {/* Update Vote Button */}
            {canUpdate && (
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
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Update My Vote
              </Button>
            )}

            {/* Download PDF Button */}
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

            {pdfError && (
              <Alert severity="error" sx={{ textAlign: 'left' }}>
                {pdfError}
              </Alert>
            )}

            {/* Go Home Button */}
            <Button
              variant="text"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
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

            {canViewResults && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1, position: 'relative' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Results Link (for your records):
                </Typography>

                <IconButton
                  onClick={handleCopyLink}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    '&:hover': { backgroundColor: 'grey.200' },
                  }}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>

                {copied && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 45,
                      color: 'success.main',
                      fontWeight: 'bold',
                    }}
                  >
                    Copied!
                  </Typography>
                )}

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
