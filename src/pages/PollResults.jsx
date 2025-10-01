import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import API from '../services/api';
import PollDetails from '../components/PollDetails';
import ResultsDisplay from '../components/ResultsDisplay';

const PollResults = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [poll, setPoll] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate share URL
  const shareUrl = `${window.location.origin}/results/${pollId}`;

  // Handle downloads - PRESERVED FROM ORIGINAL
  const handleDownloadPDF = async () => {
    try {
      const response = await API.get(`/exports/poll/${pollId}/results-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results_${poll?.short_id || pollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await API.get(`/exports/poll/${pollId}/ballots-csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ballots_${poll?.short_id || pollId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('Failed to download CSV. Please try again.');
    }
  };

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

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {poll.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Live Results Dashboard
            </Typography>
            <PollDetails poll={poll} />
          </Box>

          {/* Results Display Component with all functionality preserved */}
          <ResultsDisplay
            results={results}
            poll={poll}
            pollId={pollId}  // This ensures PairwiseBallotViewer uses DB ballots
            showExportButtons={true}  // Shows Export CSV and Export PDF buttons
            showShareButton={true}    // Shows Share button
            onDownloadPDF={handleDownloadPDF}    // Original PDF download function
            onDownloadCSV={handleDownloadCSV}    // Original CSV download function
            shareUrl={shareUrl}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default PollResults;