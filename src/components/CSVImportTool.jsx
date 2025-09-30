import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import API from '../services/api';

const CSVImportTool = ({ open, onClose, onSuccess }) => {
  const [csvData, setCsvData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pollTitle, setPollTitle] = useState('Test Election');
  const [pollDescription, setPollDescription] = useState('Imported from CSV');
  const [createdPoll, setCreatedPoll] = useState(null);

  // Sample CSV data for testing
  const sampleCSVs = {
    'Simple 3-Candidate': `count,Alice,Bob,Charlie
5,1,2,3
3,2,1,3
4,3,2,1
2,1,3,2`,
    'Condorcet Paradox': `count,Rock,Paper,Scissors
10,1,2,3
10,2,3,1
10,3,1,2`,
    'Tied Winners': `count,Option A,Option B,Option C
5,1,2,3
5,2,1,3
5,1,3,2
5,3,1,2`,
    'Clear Condorcet': `count,Winner,Second,Third,Fourth
8,1,2,3,4
3,2,1,3,4
2,3,2,1,4
1,4,3,2,1`,
    'Complex Ties': `count,A,B,C,D,E
3,1,2,2,3,4
2,2,1,3,3,4
4,3,3,1,2,4
3,2,3,3,1,4
2,4,4,4,4,1`,
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          processCsvData(result.data);
        },
        header: false,
        skipEmptyLines: true,
      });
    }
  };

  const loadSampleCSV = (sampleName) => {
    const csvText = sampleCSVs[sampleName];
    const result = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });
    processCsvData(result.data);
    setPollTitle(`${sampleName} Test`);
  };

  const processCsvData = (data) => {
    try {
      if (!data || data.length < 2) {
        setError('Invalid CSV format');
        return;
      }

      // First row should be: count, candidate1, candidate2, ...
      const headers = data[0];
      if (headers[0].toLowerCase() !== 'count') {
        setError('First column must be "count"');
        return;
      }

      const candidates = headers.slice(1).map((name, idx) => ({
        id: `candidate-${idx}`,
        name: name.trim(),
        description: null,
      }));

      // Process ballot rows
      const ballots = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length < 2) continue;

        const count = parseInt(row[0]);
        if (isNaN(count) || count <= 0) continue;

        // Build rankings for this ballot type
        const rankings = [];
        for (let j = 1; j < row.length && j <= candidates.length; j++) {
          const rank = parseInt(row[j]);
          if (!isNaN(rank) && rank > 0) {
            rankings.push({
              candidate_id: candidates[j - 1].id,
              rank: rank,
            });
          }
        }

        if (rankings.length > 0) {
          ballots.push({
            count,
            rankings,
            displayRanking: rankings
              .sort((a, b) => a.rank - b.rank)
              .map(r => {
                const cand = candidates.find(c => c.id === r.candidate_id);
                return `${r.rank}. ${cand?.name || r.candidate_id}`;
              })
              .join(', '),
          });
        }
      }

      setParsedData({
        candidates,
        ballots,
        totalVotes: ballots.reduce((sum, b) => sum + b.count, 0),
      });
      setCsvData(data);
      setError('');
    } catch (err) {
      console.error('Error processing CSV:', err);
      setError('Failed to process CSV data');
    }
  };

  const createPollFromCSV = async () => {
    if (!parsedData) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Create the poll
      const pollResponse = await API.post('/polls/', {
        title: pollTitle,
        description: pollDescription,
        candidates: parsedData.candidates,
        settings: {
          allow_write_ins: false,
          require_all_rankings: false,
          max_votes_per_ip: 1000, // High limit for testing
        },
        is_private: false,
      });

      const pollId = pollResponse.data.short_id;
      const adminToken = pollResponse.data.admin_token;

      // Step 2: Submit all ballots
      for (const ballot of parsedData.ballots) {
        await API.post('/ballots/', {
          poll_id: pollId,
          rankings: ballot.rankings,
          count: ballot.count,
          test_ballot: true, // Mark as test ballot
        });
      }

      // Step 3: Calculate results
      await API.post(`/results/calculate/${pollId}?admin_token=${adminToken}`);

      setCreatedPoll({
        id: pollId,
        adminToken,
        url: `/results/${pollId}`,
        title: pollTitle,
      });
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(pollId);
      }
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err.response?.data?.detail || 'Failed to create poll from CSV');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCsvData(null);
    setParsedData(null);
    setError('');
    setSuccess(false);
    setCreatedPoll(null);
    setPollTitle('Test Election');
    setPollDescription('Imported from CSV');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Import Election from CSV
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {!parsedData && !success && (
          <Box>
            <Typography variant="body1" paragraph>
              Upload a CSV file or choose a sample election to test.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>CSV Format:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • First row: count, Candidate1, Candidate2, ...
                <br />
                • Each data row: vote_count, rank1, rank2, ...
                <br />
                • Ranks are numbers (1 = first choice, 2 = second, etc.)
                <br />
                • Leave blank for unranked candidates
              </Typography>
            </Alert>

            {/* File Upload */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '2px dashed #ccc', textAlign: 'center' }}>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadIcon />}
                  size="large"
                >
                  Upload CSV File
                </Button>
              </label>
            </Paper>

            {/* Sample Elections */}
            <Typography variant="h6" gutterBottom>
              Or Choose a Sample Election:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.keys(sampleCSVs).map((name) => (
                <Button
                  key={name}
                  variant="outlined"
                  onClick={() => loadSampleCSV(name)}
                  sx={{ textTransform: 'none' }}
                >
                  {name}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {parsedData && !success && (
          <Box>
            <TextField
              fullWidth
              label="Poll Title"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Poll Description"
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Parsed Data Preview
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={`${parsedData.candidates.length} Candidates`} color="primary" />
                <Chip label={`${parsedData.ballots.length} Ballot Types`} color="secondary" />
                <Chip label={`${parsedData.totalVotes} Total Votes`} />
              </Box>

              {/* Candidates */}
              <Typography variant="subtitle2" gutterBottom>
                Candidates:
              </Typography>
              <Box sx={{ mb: 2 }}>
                {parsedData.candidates.map((c, idx) => (
                  <Chip key={idx} label={c.name} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>

              {/* Ballots Table */}
              <Typography variant="subtitle2" gutterBottom>
                Ballot Types:
              </Typography>
              <Paper elevation={0} sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Count</TableCell>
                      <TableCell>Rankings</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedData.ballots.map((ballot, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{ballot.count}</TableCell>
                        <TableCell>{ballot.displayRanking}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Box>
        )}

        {success && createdPoll && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="success.main">
              Poll Created Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              "{createdPoll.title}" has been created with {parsedData.totalVotes} votes.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.open(`/results/${createdPoll.id}`, '_blank')}
              >
                View Results
              </Button>
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/results/${createdPoll.id}`)}
              >
                Copy Link
              </Button>
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Creating poll and submitting ballots...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!success && (
          <>
            <Button onClick={reset} disabled={loading}>
              Reset
            </Button>
            {parsedData && (
              <Button
                variant="contained"
                onClick={createPollFromCSV}
                disabled={loading || !pollTitle}
              >
                Create Poll
              </Button>
            )}
          </>
        )}
        {success && (
          <>
            <Button onClick={reset}>
              Import Another
            </Button>
            <Button onClick={onClose} variant="contained">
              Done
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CSVImportTool;