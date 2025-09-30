import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  IconButton,
  Collapse,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Ballot as BallotIcon
} from '@mui/icons-material';
import Papa from 'papaparse';
import API from '../services/api';  // ADD THIS IMPORT

const CSVImportTool = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [parsedBallots, setParsedBallots] = useState([]);
  const [inferredCandidates, setInferredCandidates] = useState([]);
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [importMode, setImportMode] = useState('create'); // 'create' or 'existing'
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [autoRun, setAutoRun] = useState(true);
  const [createdPollData, setCreatedPollData] = useState(null);

  const steps = ['Upload CSV', 'Configure Import', 'Process'];

  // Load polls from localStorage or allow manual entry
  useEffect(() => {
    const savedPolls = JSON.parse(localStorage.getItem('createdPolls') || '[]');
    setPolls(savedPolls);
  }, []);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      setError('');
      
      // Generate default poll title from filename
      const fileName = uploadedFile.name.replace('.csv', '');
      setNewPollTitle(`Test Poll - ${fileName}`);
      setNewPollDescription(`Imported from ${uploadedFile.name} on ${new Date().toLocaleDateString()}`);
      
      Papa.parse(uploadedFile, {
        complete: (results) => {
          setCsvData(results);
          parseCsvToBallots(results.data, results.meta.fields);
          setActiveStep(1);
        },
        header: true,
        skipEmptyLines: true
      });
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const parseCsvToBallots = (data, headers) => {
    try {
      const ballots = [];
      const candidateSet = new Set();
      const writeInSet = new Set();
      
      // ALWAYS skip first header (it's the count column) and extract candidate names from remaining headers
      // Also filter out empty headers and auto-generated names (like _1, _2, etc)
      const candidateHeaders = headers.slice(1).filter(h => {
        if (!h || h.trim() === '') return false;
        // Filter out auto-generated column names that Papa Parse might create
        if (h.match(/^_\d+$/)) return false;  // Matches _1, _2, etc.
        if (h.match(/^field\d+$/i)) return false;  // Matches field1, field2, etc.
        if (h.match(/^column_?\d+$/i)) return false;  // Matches column1, column_1, etc.
        return true;
      });
      
      console.log('Raw headers:', headers);
      console.log('Detected candidate headers:', candidateHeaders);
      
      // Process each candidate header to identify regular vs write-ins
      candidateHeaders.forEach(header => {
        const isWriteIn = header.includes('(write-in)') || header.startsWith('WRITE:');
        const candidateName = header.replace('(write-in)', '').replace('WRITE:', '').trim();
        
        if (candidateName) {  // Only add if not empty
          if (isWriteIn) {
            writeInSet.add(candidateName);
          } else {
            candidateSet.add(candidateName);
          }
        }
      });
      
      // Create candidate objects for poll creation
      const candidates = Array.from(candidateSet).map((name, idx) => ({
        id: `candidate-${idx}`,
        name: name,
        description: null
      }));
      
      setInferredCandidates(candidates);
      
      // Create a map from candidate name to ID for easy lookup
      const candidateNameToId = {};
      candidates.forEach(c => {
        candidateNameToId[c.name] = c.id;
      });
      
      // Process ballot data
      data.forEach((row, rowIndex) => {
        // ALWAYS use first column as count, regardless of its header name
        const allKeys = Object.keys(row);
        const countKey = allKeys[0];  // First column is ALWAYS count
        const count = parseInt(row[countKey]) || 0;
        
        // Skip rows with invalid or zero count
        if (isNaN(count) || count <= 0) {
          console.log(`Skipping row ${rowIndex + 2}: invalid count ${row[countKey]}`);
          return;
        }

        const rankings = [];
        const writeIns = [];
        
        // Process each candidate column (using the candidate headers, not the first column)
        candidateHeaders.forEach((candidateName) => {
          if (!candidateName || candidateName.trim() === '') return;
          
          const rank = row[candidateName];
          
          if (rank && rank !== '' && !isNaN(parseInt(rank))) {
            const isWriteIn = candidateName.includes('(write-in)') || candidateName.startsWith('WRITE:');
            const cleanName = candidateName.replace('(write-in)', '').replace('WRITE:', '').trim();
            
            if (isWriteIn) {
              const writeInId = `write-in-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              writeIns.push({
                id: writeInId,
                name: cleanName,
                is_write_in: true
              });
              rankings.push({
                candidate_id: writeInId,
                rank: parseInt(rank)
              });
            } else {
              // Use the candidate ID from our mapping
              const candidateId = candidateNameToId[cleanName];
              if (candidateId) {
                rankings.push({
                  candidate_id: candidateId,
                  rank: parseInt(rank)
                });
              }
            }
          }
        });

        if (rankings.length > 0) {
          ballots.push({
            rankings,
            write_ins: writeIns,
            count,
            rowIndex: rowIndex + 2  // +2 because row 1 is headers, data starts at row 2
          });
        }
      });

      setParsedBallots(ballots);
      const totalVotes = ballots.reduce((sum, b) => sum + b.count, 0);
      setSuccess(`Successfully parsed ${ballots.length} unique ballot patterns representing ${totalVotes} total votes`);
      
      console.log('Detected candidates:', candidates.map(c => c.name));
      if (ballots.length > 0) {
        console.log('Sample ballot:', ballots[0]);
      }
      
    } catch (err) {
      setError(`Error parsing CSV: ${err.message}`);
      console.error('Parse error:', err);
    }
  };

  const createPoll = async () => {
    try {
      const pollData = {
        title: newPollTitle,
        description: newPollDescription,
        candidates: inferredCandidates,
        is_private: false,
        settings: {
          allow_write_ins: true,
          show_live_results: true,
          results_visibility: "public",
          allow_ties: true
        }
      };

      const response = await API.post('/polls/', pollData);
      const created = response.data;
      
      setCreatedPollData(created);
      setSelectedPoll(created.short_id);
      setAdminToken(created.admin_token);
      
      // Save to localStorage
      const savedPolls = JSON.parse(localStorage.getItem('createdPolls') || '[]');
      savedPolls.push({
        id: created.id,
        short_id: created.short_id,
        title: newPollTitle,
        admin_token: created.admin_token,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('createdPolls', JSON.stringify(savedPolls));
      
      return created;
    } catch (err) {
      throw new Error(`Poll creation failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let pollId = selectedPoll;
      let token = adminToken;

      // Create poll first if in create mode
      if (importMode === 'create') {
        const created = await createPoll();
        pollId = created.short_id;
        token = created.admin_token;
        setSuccess(`Poll "${newPollTitle}" created successfully!`);
      }

      // Import ballots
      const importData = {
        poll_id: pollId,
        admin_token: token,
        ballots: parsedBallots.map(({ rowIndex, ...ballot }) => ballot)
      };

      const response = await API.post('/ballots/bulk-import', importData);
      const result = response.data;
      
      setImportResult(result);
      
      // Auto-run calculation if enabled
      if (autoRun && pollId && token) {
        await calculateResults(pollId, token);
      }
      
      setSuccess(`Import complete! ${result.message}`);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = async (pollId, token) => {
    try {
      const response = await API.post(`/results/calculate/${pollId}?admin_token=${token}`);
      const results = response.data;
      console.log('Results calculated:', results);
    } catch (err) {
      console.error('Error calculating results:', err);
    }
  };

  const resetImport = () => {
    setFile(null);
    setCsvData(null);
    setParsedBallots([]);
    setInferredCandidates([]);
    setSelectedPoll('');
    setAdminToken('');
    setError('');
    setSuccess('');
    setImportResult(null);
    setCreatedPollData(null);
    setImportMode('create');
    setActiveStep(0);
  };

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          CSV Ballot Import Tool
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Import ballot data from CSV files for testing different election scenarios
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Step 1: Upload CSV */}
        {activeStep === 0 && (
          <Box>
            <Card variant="outlined" sx={{ p: 3, textAlign: 'center', borderStyle: 'dashed' }}>
              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="csv-file-input"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="csv-file-input">
                <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Upload CSV File
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select a CSV file with ballot data to import
                </Typography>
                <Button variant="contained" component="span">
                  Choose File
                </Button>
              </label>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                CSV Format Guidelines:
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li><strong>First column is ALWAYS the count</strong> (number of ballots with that ranking pattern)</li>
                  <li>First row contains candidate names as column headers (starting from column 2)</li>
                  <li>Each cell contains the rank (1, 2, 3, etc.) that candidate received</li>
                  <li>Leave cells empty for unranked candidates</li>
                  <li>Write-ins can be marked with "(write-in)" suffix or "WRITE:" prefix</li>
                </ul>
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Example CSV:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 600 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>[count]</TableCell>
                      <TableCell>Alice</TableCell>
                      <TableCell>Bob</TableCell>
                      <TableCell>Charlie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>10</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>3</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>5</TableCell>
                      <TableCell>2</TableCell>
                      <TableCell>1</TableCell>
                      <TableCell>3</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>3</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell></TableCell>
                      <TableCell>1</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Note: First column header can be empty, "count", or any text - it's always treated as the count column
              </Typography>
            </Box>
          </Box>
        )}

        {/* Step 2: Review & Configure */}
        {activeStep === 1 && (
          <Box>
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Import Mode
              </Typography>
              <RadioGroup
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
              >
                <FormControlLabel
                  value="create"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Create New Poll (Recommended)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Automatically create a poll from CSV data
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="existing"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Import to Existing Poll</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Add ballots to an already created poll
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Card>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {importMode === 'create' ? (
                  <Box>
                    <TextField
                      fullWidth
                      label="Poll Title"
                      value={newPollTitle}
                      onChange={(e) => setNewPollTitle(e.target.value)}
                      sx={{ mb: 2 }}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Poll Description"
                      value={newPollDescription}
                      onChange={(e) => setNewPollDescription(e.target.value)}
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                    />
                    
                    <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Detected Candidates ({inferredCandidates.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {inferredCandidates.map((candidate, idx) => (
                          <Chip
                            key={idx}
                            label={candidate.name}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Card>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoRun}
                          onChange={(e) => setAutoRun(e.target.checked)}
                        />
                      }
                      label="Auto-calculate results after import"
                    />
                  </Box>
                ) : (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Target Poll</InputLabel>
                      <Select
                        value={selectedPoll}
                        onChange={(e) => setSelectedPoll(e.target.value)}
                        label="Select Target Poll"
                      >
                        <MenuItem value="">
                          <em>Manual Entry</em>
                        </MenuItem>
                        {polls.map((poll) => (
                          <MenuItem key={poll.id} value={poll.short_id}>
                            {poll.title} ({poll.short_id})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {!selectedPoll && polls.length === 0 && (
                      <TextField
                        fullWidth
                        label="Poll ID (short_id or UUID)"
                        value={selectedPoll}
                        onChange={(e) => setSelectedPoll(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                    )}

                    <TextField
                      fullWidth
                      label="Admin Token"
                      type="password"
                      value={adminToken}
                      onChange={(e) => setAdminToken(e.target.value)}
                      required
                      sx={{ mb: 2 }}
                    />
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Import Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2">
                      <strong>File:</strong> {file?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Rows:</strong> {csvData?.data?.length || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Valid Ballots:</strong> {parsedBallots.length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Votes:</strong> {parsedBallots.reduce((sum, b) => sum + b.count, 0)}
                    </Typography>
                    {importMode === 'create' && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Candidates:</strong> {inferredCandidates.length}
                      </Typography>
                    )}
                    {parsedBallots.some(b => b.write_ins.length > 0) && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Contains Write-ins:</strong> Yes
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Parsed Ballots Preview
                </Typography>
                <IconButton onClick={() => setPreviewExpanded(!previewExpanded)}>
                  {previewExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={previewExpanded}>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Rankings</TableCell>
                        <TableCell>Write-ins</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedBallots.slice(0, 50).map((ballot, index) => (
                        <TableRow key={index}>
                          <TableCell>{ballot.rowIndex}</TableCell>
                          <TableCell>{ballot.count}</TableCell>
                          <TableCell>
                            {ballot.rankings
                              .sort((a, b) => a.rank - b.rank)
                              .map(r => {
                                const candidate = inferredCandidates.find(c => c.id === r.candidate_id);
                                const displayName = candidate ? candidate.name : r.candidate_id;
                                return `${r.rank}: ${displayName}`;
                              })
                              .join(', ')
                            }
                          </TableCell>
                          <TableCell>
                            {ballot.write_ins.map(w => (
                              <Chip 
                                key={w.id} 
                                label={w.name} 
                                size="small" 
                                sx={{ mr: 0.5 }}
                              />
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsedBallots.length > 50 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              ... and {parsedBallots.length - 50} more ballot patterns
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={
                  loading ||
                  parsedBallots.length === 0 ||
                  (importMode === 'create' ? !newPollTitle : (!selectedPoll || !adminToken))
                }
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {loading ? 'Processing...' : (importMode === 'create' ? 'Create Poll & Import' : 'Import Ballots')}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Success */}
        {activeStep === 2 && (
          <Box>
            {importResult && (
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 32 }} />
                    <Typography variant="h5">Import Complete!</Typography>
                  </Box>
                  
                  {createdPollData && (
                    <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="h6" gutterBottom>
                        Poll Created Successfully
                      </Typography>
                      <Typography variant="body2">
                        <strong>Poll ID:</strong> {createdPollData.short_id}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Admin Token:</strong>{' '}
                        <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                          {createdPollData.admin_token}
                        </code>
                      </Typography>
                      <Typography variant="caption" color="warning.main">
                        Save this admin token! You'll need it to manage the poll.
                      </Typography>
                    </Card>
                  )}
                  
                  <Typography variant="body2" paragraph>
                    {importResult.message}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Import Batch ID:</strong> {importResult.import_batch_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Unique Patterns:</strong> {importResult.unique_patterns}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Votes:</strong> {importResult.total_votes}
                  </Typography>
                  
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={resetImport}
                      startIcon={<RefreshIcon />}
                    >
                      Import Another File
                    </Button>
                    <Button
                      variant="outlined"
                      href={`/results/${createdPollData?.short_id || selectedPoll}`}
                      target="_blank"
                      startIcon={<BallotIcon />}
                    >
                      View Results
                    </Button>
                    <Button
                      variant="outlined"
                      href={`/admin/${createdPollData?.short_id || selectedPoll}?token=${createdPollData?.admin_token || adminToken}`}
                      target="_blank"
                    >
                      Admin Dashboard
                    </Button>
                    <Button
                      variant="outlined"
                      href={`/vote/${createdPollData?.short_id || selectedPoll}`}
                      target="_blank"
                    >
                      Voting Page
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  </Box>
  );
};

export default CSVImportTool;