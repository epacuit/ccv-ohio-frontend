import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
  alpha,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  BallotOutlined as BallotIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import API from '../services/api';
import ResultsDisplay from '../components/ResultsDisplay';
import VoteInputTable from '../components/vote/VoteInputTable';
import DemoPairwiseBallotViewer from '../components/DemoPairwiseBallotViewer';

// Example elections data
const EXAMPLE_ELECTIONS = [
  {
    name: "Maximum Wins",
    candidates: ['A', 'B', 'C', 'D'],
    ballots: [
      { count: 1, rankings: { 'A': 1, 'B': 3, 'C': 4, 'D': 2 } },
      { count: 1, rankings: { 'A': 3, 'B': 2, 'C': 4, 'D': 1 } },
      { count: 1, rankings: { 'A': 3, 'B': 1, 'C': 4, 'D': 2 } },
      { count: 1, rankings: { 'A': 2, 'B': 1, 'C': 4, 'D': 3 } },
    ]
  },
  {
    name: "Minimum Loss",
    candidates: ['A', 'B', 'C', 'D'],
    ballots: [
      { count: 1, rankings: { 'A': 1, 'B': 2, 'C': 3, 'D': 4 } },
      { count: 1, rankings: { 'A': 2, 'B': 3, 'C': 4, 'D': 1 } },
      { count: 1, rankings: { 'A': 4, 'B': 1, 'C': 2, 'D': 3 } },
      { count: 1, rankings: { 'A': 2, 'B': 3, 'C': 1, 'D': 4 } },
      { count: 1, rankings: { 'A': 3, 'B': 4, 'C': 1, 'D': 2 } },
    ]
  },
  {
    name: "Tied Election",
    candidates: ['A', 'B', 'C', 'D'],
    ballots: [
      { count: 1, rankings: { 'A': 4, 'B': 2, 'C': 3, 'D': 1 } },
      { count: 2, rankings: { 'A': 1, 'B': 4, 'C': 3, 'D': 2 } },
      { count: 1, rankings: { 'A': 4, 'B': 1, 'C': 2, 'D': 3 } },
      { count: 1, rankings: { 'A': 2, 'B': 1, 'C': 4, 'D': 3 } },
    ]
  },
  {
    name: "Sample Election",
    candidates: ['D', 'M', 'R'],
    ballots: [
      { count: 37, rankings: { 'D': 1, 'M': 2, 'R': 3 } },
      { count: 3, rankings: { 'D': 1, 'M': 3, 'R': 2 } },
      { count: 32, rankings: { 'D': 3, 'M': 2, 'R': 1 } },
      { count: 28, rankings: { 'D': 3, 'M': 1, 'R': 2 } },
    ]
  }
];

const DemoPage = () => {
  const theme = useTheme();
  const [candidates, setCandidates] = useState(['Alice', 'Bob', 'Charlie', 'Diana']);
  const [ballots, setBallots] = useState([
    { id: 1, count: 45, rankings: { 'Alice': 1, 'Bob': 2, 'Charlie': 3 } },
    { id: 2, count: 30, rankings: { 'Bob': 1, 'Charlie': 2, 'Diana': 3 } },
    { id: 3, count: 20, rankings: { 'Charlie': 1, 'Diana': 2, 'Alice': 3 } },
    { id: 4, count: 15, rankings: { 'Diana': 1, 'Alice': 2 } },
  ]);
  const [nextBallotId, setNextBallotId] = useState(5);
  
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  
  // Dialog states
  const [addBallotDialogOpen, setAddBallotDialogOpen] = useState(false);
  const [ballotViewerOpen, setBallotViewerOpen] = useState(false);
  
  // Example elections menu
  const [exampleMenuAnchor, setExampleMenuAnchor] = useState(null);
  
  // Ballot entry states
  const [newBallotSelections, setNewBallotSelections] = useState({});
  const [newBallotCount, setNewBallotCount] = useState(10);

  const handleAddCandidate = () => {
    const newName = `Candidate ${candidates.length + 1}`;
    setCandidates([...candidates, newName]);
  };

  const handleCandidateNameChange = (index, newName) => {
    const oldName = candidates[index];
    const newCandidates = [...candidates];
    newCandidates[index] = newName;
    setCandidates(newCandidates);
    
    // Update all ballots to use the new name
    const updatedBallots = ballots.map(ballot => {
      const newRankings = { ...ballot.rankings };
      if (oldName in newRankings) {
        newRankings[newName] = newRankings[oldName];
        delete newRankings[oldName];
      }
      return { ...ballot, rankings: newRankings };
    });
    setBallots(updatedBallots);
  };

  const handleRemoveCandidate = (index) => {
    const removedName = candidates[index];
    const newCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(newCandidates);
    
    // Remove this candidate from all ballots
    const updatedBallots = ballots.map(ballot => {
      const newRankings = { ...ballot.rankings };
      delete newRankings[removedName];
      return { ...ballot, rankings: newRankings };
    });
    setBallots(updatedBallots);
  };

  const handleAddBallot = () => {
    setNewBallotSelections({});
    setNewBallotCount(10);
    setAddBallotDialogOpen(true);
  };

  const handleSaveNewBallot = () => {
    // Convert selections to rankings format
    const rankings = {};
    Object.entries(newBallotSelections).forEach(([candidateName, rank]) => {
      if (rank && rank > 0) {
        rankings[candidateName] = rank;
      }
    });
    
    setBallots([...ballots, { 
      id: nextBallotId, 
      count: newBallotCount, 
      rankings 
    }]);
    setNextBallotId(nextBallotId + 1);
    setAddBallotDialogOpen(false);
  };

  const handleRemoveBallot = (id) => {
    setBallots(ballots.filter(b => b.id !== id));
  };

  const handleBallotCountChange = (id, newCount) => {
    setBallots(ballots.map(b => 
      b.id === id ? { ...b, count: Math.max(1, parseInt(newCount) || 1) } : b
    ));
  };

  const handleRankChange = (ballotId, candidateName, newRank) => {
    setBallots(ballots.map(b => {
      if (b.id !== ballotId) return b;
      
      const newRankings = { ...b.rankings };
      if (newRank === '' || newRank === null) {
        delete newRankings[candidateName];
      } else {
        const rank = parseInt(newRank);
        if (!isNaN(rank) && rank > 0) {
          newRankings[candidateName] = rank;
        }
      }
      return { ...b, rankings: newRankings };
    }));
  };

  const loadExample = (example) => {
    setCandidates(example.candidates);
    const ballotsWithIds = example.ballots.map((b, i) => ({
      id: i + 1,
      ...b
    }));
    setBallots(ballotsWithIds);
    setNextBallotId(ballotsWithIds.length + 1);
    setResults(null);
    setExampleMenuAnchor(null);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setError('');
    
    try {
      // Convert to API format
      const candidatesData = candidates.map((name, index) => ({
        id: `cand_${index}`,
        name: name,
      }));

      const ballotsData = ballots.map(ballot => ({
        rankings: Object.entries(ballot.rankings).map(([candidateName, rank]) => {
          const candidateIndex = candidates.indexOf(candidateName);
          return {
            candidate_id: `cand_${candidateIndex}`,
            rank: rank
          };
        }),
        count: ballot.count
      }));

      const response = await API.post('/demo/calculate', {
        candidates: candidatesData,
        ballots: ballotsData
      });

      setResults(response.data);
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err.response?.data?.detail || 'Failed to calculate results');
    } finally {
      setCalculating(false);
    }
  };

  const getTotalVotes = () => {
    return ballots.reduce((sum, b) => sum + b.count, 0);
  };

  // CSV Export function
  const handleExportCSV = () => {
    // Create CSV header
    const header = ['Count', ...candidates].join(',');
    
    // Create CSV rows
    const rows = ballots.map(ballot => {
      const count = ballot.count;
      const rankings = candidates.map(candidate => ballot.rankings[candidate] || '');
      return [count, ...rankings].join(',');
    });
    
    // Combine header and rows
    const csvContent = [header, ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demo_ballots_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // CSV Import function
  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('Invalid CSV file: must contain header and at least one ballot');
          return;
        }
        
        // Parse header to get candidate names
        const header = lines[0].split(',').map(h => h.trim());
        
        // Handle both formats: with or without "Count" header
        let importedCandidates;
        let startLine = 1;
        
        if (header[0].toLowerCase() === 'count') {
          importedCandidates = header.slice(1).filter(h => h);
        } else if (header[0] === '' || !isNaN(parseInt(header[0]))) {
          // First column is empty or a number, rest are candidates
          importedCandidates = header.slice(1).filter(h => h);
        } else {
          // First column might be a candidate
          alert('Invalid CSV format: first column must be "Count" or empty');
          return;
        }
        
        // Parse ballot rows
        const importedBallots = [];
        for (let i = startLine; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const count = parseInt(values[0]) || 1;
          
          const rankings = {};
          for (let j = 0; j < importedCandidates.length; j++) {
            const rank = values[j + 1];
            if (rank && !isNaN(parseInt(rank))) {
              rankings[importedCandidates[j]] = parseInt(rank);
            }
          }
          
          if (Object.keys(rankings).length > 0) {
            importedBallots.push({
              id: importedBallots.length + 1,
              count: count,
              rankings: rankings
            });
          }
        }
        
        // Update state
        setCandidates(importedCandidates);
        setBallots(importedBallots);
        setNextBallotId(importedBallots.length + 1);
        setResults(null);
        
        alert(`Successfully imported ${importedBallots.length} ballots with ${importedCandidates.length} candidates`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Create mock poll object for ResultsDisplay
  const mockPoll = results ? {
    title: 'Demo Election',
    description: 'Interactive voting method demonstration',
    candidates: candidates.map((name, index) => ({
      id: `cand_${index}`,
      name: name,
    }))
  } : null;

  // Format candidates for VotingInputTable
  const candidatesForVoting = candidates.map((name, index) => ({
    id: name, // Using name as ID for simplicity in demo
    name: name,
  }));

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Consensus Choice Demo
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Explore how pairwise comparisons find the candidate with the broadest support
            </Typography>
          </Box>

          {/* Candidates Section */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 500 }}>Candidates</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCandidate}
                disabled={candidates.length >= 10}
                size="small"
              >
                Add Candidate
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {candidates.map((name, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    value={name}
                    onChange={(e) => handleCandidateNameChange(index, e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'divider',
                        },
                      }
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveCandidate(index)}
                    disabled={candidates.length <= 2}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Ballots Table */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>Ballot Editor</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Add or edit ballots to simulate different voting patterns
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {results && (
                  <Button
                    variant="outlined"
                    startIcon={<BallotIcon />}
                    onClick={() => setBallotViewerOpen(true)}
                    size="small"
                  >
                    View Pairwise
                  </Button>
                )}
                <Chip 
                  label={`${getTotalVotes()} votes`} 
                  color="primary" 
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Box>

            {ballots.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Count</TableCell>
                      {candidates.map((name, index) => (
                        <TableCell 
                          key={index} 
                          align="center" 
                          sx={{ 
                            fontWeight: 'bold', 
                            minWidth: { xs: 80, sm: 100 },
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {name}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 'bold', width: 60 }}>
                        <DeleteIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ballots.map((ballot) => (
                      <TableRow 
                        key={ballot.id} 
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                      >
                        <TableCell>
                          <TextField
                            type="number"
                            value={ballot.count}
                            onChange={(e) => handleBallotCountChange(ballot.id, e.target.value)}
                            size="small"
                            variant="outlined"
                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                            sx={{ 
                              width: 85,
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'divider',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'primary.main',
                                },
                              }
                            }}
                          />
                        </TableCell>
                        {candidates.map((name, index) => (
                          <TableCell key={index} align="center">
                            <TextField
                              type="number"
                              value={ballot.rankings[name] || ''}
                              onChange={(e) => handleRankChange(ballot.id, name, e.target.value)}
                              size="small"
                              placeholder="-"
                              variant="standard"
                              inputProps={{ 
                                min: 1, 
                                max: candidates.length,
                                style: { textAlign: 'center' } 
                              }}
                              sx={{ 
                                width: { xs: 50, sm: 60 },
                                '& .MuiInput-root': {
                                  '&:before': {
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                                  },
                                  '&:hover:not(.Mui-disabled):before': {
                                    borderBottom: '2px solid rgba(0, 0, 0, 0.87)',
                                  },
                                }
                              }}
                            />
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleRemoveBallot(ballot.id)}
                            size="small"
                            color="error"
                            disabled={ballots.length <= 1}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'error.light',
                                color: 'error.contrastText'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No ballots added yet. Click "Add Ballot" to get started.
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddBallot}
              >
                Add Ballot
              </Button>
              
              <Button
                variant="outlined"
                endIcon={<ArrowDropDownIcon />}
                onClick={(e) => setExampleMenuAnchor(e.currentTarget)}
              >
                Load Example
              </Button>
              <Menu
                anchorEl={exampleMenuAnchor}
                open={Boolean(exampleMenuAnchor)}
                onClose={() => setExampleMenuAnchor(null)}
              >
                {EXAMPLE_ELECTIONS.map((example) => (
                  <MenuItem key={example.name} onClick={() => loadExample(example)}>
                    {example.name}
                  </MenuItem>
                ))}
              </Menu>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label htmlFor="csv-upload" style={{ display: 'flex' }}>
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Import CSV
                </Button>
              </label>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                disabled={ballots.length === 0}
              >
                Export CSV
              </Button>
              
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                size="large"
                startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleCalculate}
                disabled={calculating || candidates.length < 2 || ballots.length === 0}
              >
                {calculating ? 'Calculating...' : 'Calculate Results'}
              </Button>
            </Box>
          </Paper>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Results Display */}
          {results && mockPoll && (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 500 }}>Results</Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setResults(null)}
                  size="small"
                >
                  Reset
                </Button>
              </Box>
              
              <Divider sx={{ mb: 4 }} />
              
              <ResultsDisplay
                results={results}
                poll={mockPoll}
                pollId={null}
                showExportButtons={false}
                showShareButton={false}
                CustomBallotViewer={DemoPairwiseBallotViewer}
                customBallotViewerProps={{
                  candidates: candidatesForVoting,
                  ballots: ballots,
                  results: results
                }}
              />
            </Paper>
          )}
        </Box>
      </Container>

      {/* Add Ballot Dialog */}
      <Dialog
        open={addBallotDialogOpen}
        onClose={() => setAddBallotDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BallotIcon color="primary" />
            <Typography variant="h6">Add New Ballot</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Number of votes with this ranking"
              type="number"
              value={newBallotCount}
              onChange={(e) => setNewBallotCount(Math.max(1, parseInt(e.target.value) || 1))}
              fullWidth
              inputProps={{ min: 1 }}
              sx={{ mb: 3 }}
            />
            <Box sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <VoteInputTable
                candidates={candidatesForVoting}
                allCandidates={candidatesForVoting}
                selections={newBallotSelections}
                onSelectionChange={setNewBallotSelections}
                settings={{ allow_ties: true }}
                numRanks={candidates.length}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBallotDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNewBallot} variant="contained">
            Add Ballot
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pairwise Ballot Viewer */}
      {results && (
        <DemoPairwiseBallotViewer
          isOpen={ballotViewerOpen}
          onClose={() => setBallotViewerOpen(false)}
          candidates={candidatesForVoting}
          ballots={ballots}
          results={results}
        />
      )}
    </Box>
  );
};

export default DemoPage;