import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  FileUpload as FileUploadIcon,
  ContentPaste as PasteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Info as InfoIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import API from '../../services/api';

/**
 * AdminBulkImportTab Component
 * 
 * Handles bulk import of ballots via CSV
 */
const AdminBulkImportTab = ({
  poll,
  onImportComplete,
  onError,
  logAdminAction,
  getAuthData,
}) => {
  const [importDialog, setImportDialog] = useState(false);
  const [importMethod, setImportMethod] = useState('csv');
  const [importData, setImportData] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  const validateCandidateNames = (csvCandidates, pollCandidates) => {
    const errors = [];
    const pollNames = pollCandidates.map(opt => opt.name.toLowerCase());
    const csvNamesLower = csvCandidates.map(name => name.toLowerCase());
    
    // Check for CSV candidates not in poll
    csvCandidates.forEach((csvCandidate, index) => {
      if (!pollNames.includes(csvCandidate.toLowerCase())) {
        errors.push({
          type: 'missing_in_poll',
          message: `CSV candidate "${csvCandidate}" not found in poll options`,
          candidate: csvCandidate
        });
      }
    });
    
    // Check for poll candidates not in CSV
    pollCandidates.forEach(pollOption => {
      if (!csvNamesLower.includes(pollOption.name.toLowerCase())) {
        errors.push({
          type: 'missing_in_csv',
          message: `Poll option "${pollOption.name}" not found in CSV headers`,
          candidate: pollOption.name
        });
      }
    });
    
    return errors;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      setValidationErrors([]);
      
      Papa.parse(file, {
        complete: (results) => {
          if (results.data && results.data.length > 1) {
            const headers = results.data[0];
            const rows = results.data.slice(1).filter(row => row.length > 1);
            
            const candidateNames = headers.slice(1).filter(h => h && h.trim());
            
            // Validate candidate names
            const errors = validateCandidateNames(candidateNames, poll.options);
            setValidationErrors(errors);
            
            let totalBallots = 0;
            let uniqueRankings = 0;
            rows.forEach(row => {
              const voterCount = row[0] ? parseInt(row[0]) : 1;
              if (!isNaN(voterCount) && voterCount > 0) {
                totalBallots += voterCount;
                uniqueRankings++;
              }
            });
            
            const preview = {
              candidateNames,
              ballotCount: totalBallots,
              uniqueRankings: uniqueRankings,
              sampleRows: rows.slice(0, 5),
              hasErrors: errors.length > 0
            };
            
            setParsedData(preview);
            setImportData(results.data.map(row => row.join(',')).join('\n'));
          }
        },
        error: (error) => {
          onError('Failed to parse CSV file');
        }
      });
    }
  };
  
  const handleImportOpen = (method = 'csv') => {
    setImportMethod(method);
    setImportDialog(true);
    setOverwriteExisting(false);
    setConfirmOverwrite(false);
    setValidationErrors([]);
  };
  
  const handleImportClose = () => {
    setImportDialog(false);
    setImporting(false);
    setParsedData(null);
    setImportData('');
    setImportFile(null);
    setImportProgress(0);
    setOverwriteExisting(false);
    setConfirmOverwrite(false);
    setValidationErrors([]);
  };

  const handleBulkImport = async () => {
    // If overwrite is selected and not yet confirmed, show confirmation
    if (overwriteExisting && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }
    
    setImporting(true);
    
    try {
      // If overwrite is requested, first clear existing ballots
      if (overwriteExisting) {
        const authData = getAuthData();
        try {
          await API.delete(`/ballots/poll/${poll.id || poll.short_id}/clear?admin_token=${authData.admin_token}`);
          console.log('Cleared existing ballots');
        } catch (clearError) {
          console.error('Error clearing ballots:', clearError);
          // Continue with import even if clear fails
        }
      }
      
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const candidateNames = headers.slice(1).filter(h => h);
      
      // Final validation before import
      const errors = validateCandidateNames(candidateNames, poll.options);
      if (errors.length > 0) {
        throw new Error('Candidate name mismatch. Please fix the CSV headers to match poll options.');
      }
      
      const nameToOptionId = {};
      poll.options.forEach(option => {
        const matchingCandidate = candidateNames.find(
          c => c.toLowerCase() === option.name.toLowerCase()
        );
        if (matchingCandidate) {
          nameToOptionId[matchingCandidate] = option.id;
        } else if (candidateNames.includes(option.name)) {
          nameToOptionId[option.name] = option.id;
        }
      });
      
      const ballots = [];
      let totalVoterCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length <= 1) continue;
        
        const voterCount = values[0] ? parseInt(values[0]) : 1;
        if (isNaN(voterCount) || voterCount <= 0) continue;
        
        const rankings = [];
        
        candidateNames.forEach((candidateName, index) => {
          const rankValue = values[index + 1];
          if (rankValue && !isNaN(rankValue) && parseInt(rankValue) > 0) {
            rankings.push({
              candidate_id: nameToOptionId[candidateName],  // Changed from option_id
              rank: parseInt(rankValue)
            });
          }
        });
        
        if (rankings.length > 0) {
          // Create one ballot record with count instead of duplicating
          ballots.push({
            poll_id: poll.id || poll.short_id,
            rankings: rankings,
            count: voterCount,  // Use count field instead of duplicating
            test_mode_key: 'admin_import'
          });
          totalVoterCount += voterCount;
        }
        
        // Update progress
        setImportProgress((i / lines.length) * 100);
      }
      
      if (ballots.length === 0) {
        throw new Error('No valid ballots found in CSV');
      }
      
      const authData = getAuthData();
      const requestData = {
        poll_id: poll.id || poll.short_id,
        admin_token: authData.admin_token,
        ballots: ballots
      };
      
      console.log('Importing ballots:', requestData);
      const response = await API.post('/ballots/bulk-import', requestData);
      
      logAdminAction('BULK_IMPORT', `Imported ${response.data.imported_count || response.data.total_votes || ballots.length} ballots from ${totalVoterCount} voters${overwriteExisting ? ' (replaced existing)' : ''}`, {
        method: importMethod,
        count: response.data.imported_count || response.data.total_votes || ballots.length,
        totalVoters: totalVoterCount,
        filename: importFile?.name,
        overwrite: overwriteExisting
      });
      
      handleImportClose();
      onImportComplete();
      
    } catch (err) {
      console.error('Bulk import error:', err);
      onError('Failed to import ballots: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImporting(false);
      setConfirmOverwrite(false);
    }
  };

  const handlePasteDataChange = (e) => {
    setImportData(e.target.value);
    setValidationErrors([]);
    
    if (e.target.value.trim()) {
      const lines = e.target.value.trim().split('\n');
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim());
        const candidateNames = headers.slice(1).filter(h => h);
        const rows = lines.slice(1).filter(line => line.split(',').length > 1);
        
        // Validate candidate names
        const errors = validateCandidateNames(candidateNames, poll.options);
        setValidationErrors(errors);
        
        let totalBallots = 0;
        let uniqueRankings = 0;
        rows.forEach(line => {
          const values = line.split(',');
          const voterCount = values[0] ? parseInt(values[0]) : 1;
          if (!isNaN(voterCount) && voterCount > 0) {
            totalBallots += voterCount;
            uniqueRankings++;
          }
        });
        
        setParsedData({
          candidateNames,
          ballotCount: totalBallots,
          uniqueRankings: uniqueRankings,
          hasErrors: errors.length > 0
        });
      }
    } else {
      setParsedData(null);
    }
  };

  const canImport = () => {
    if (importing) return false;
    if (importMethod === 'csv' && !importFile) return false;
    if (importMethod === 'paste' && !importData.trim()) return false;
    if (validationErrors.length > 0) return false;
    return true;
  };

  return (
    <>
      <Stack spacing={3}>
        {/* Header Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Import Ballots
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import multiple ballots at once using CSV format. Each row represents a unique ranking pattern with voter counts.
          </Typography>
        </Box>

        {/* Import Method Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{ 
                p: 3,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-2px)',
                }
              }}
              onClick={() => handleImportOpen('csv')}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9,
                  }}
                >
                  <FileUploadIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Upload CSV File
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a file from your computer
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{ 
                p: 3,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                  transform: 'translateY(-2px)',
                }
              }}
              onClick={() => handleImportOpen('paste')}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.9,
                  }}
                >
                  <PasteIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Paste CSV Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Copy and paste from spreadsheet
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Format Instructions */}
        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                CSV Format Requirements
              </Typography>
            </Box>
            
            <Stack spacing={1.5}>
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                  1.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Header row:</strong> Count, {poll?.options?.map(o => o.name).join(', ') || 'Candidate names'}
                </Typography>
              </Box>
              
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                  2.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>First column:</strong> Number of voters with this ranking (blank = 1)
                </Typography>
              </Box>
              
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                  3.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Ranking values:</strong> 1 = first choice, 2 = second choice, etc.
                </Typography>
              </Box>
              
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                  4.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leave cells empty for unranked options
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1 }} />
            
            {/* Example Table */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }} color="text.secondary">
                Example:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5,
                  backgroundColor: 'background.paper',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                <Box component="pre" sx={{ margin: 0, lineHeight: 1.5 }}>
{`Count,${poll?.options?.slice(0, 3).map(o => o.name).join(',') || 'Alice,Bob,Charlie'}
5,1,2,3
3,2,1,3
,3,2,1`}
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This example shows 5 voters ranking first candidate as #1, 3 voters with a different pattern, and 1 voter with another pattern
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>
      
      {/* Import Dialog */}
      <Dialog
        open={importDialog}
        onClose={handleImportClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {importMethod === 'csv' ? <FileUploadIcon /> : <PasteIcon />}
            <Typography variant="h6">
              {importMethod === 'csv' ? 'Upload CSV File' : 'Paste CSV Data'}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={3}>
            {importMethod === 'csv' && (
              <>
                <Box>
                  <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="csv-file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="csv-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<FileUploadIcon />}
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        borderStyle: 'dashed',
                        '&:hover': {
                          borderStyle: 'solid'
                        }
                      }}
                    >
                      {importFile ? 'Change File' : 'Select CSV File'}
                    </Button>
                  </label>
                </Box>
                
                {importFile && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FileIcon sx={{ color: 'text.secondary' }} />
                      <Box flex={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {importFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}
              </>
            )}
            
            {importMethod === 'paste' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Paste your CSV data below. First row should be headers, first column is voter count.
                </Typography>
                <TextField
                  multiline
                  rows={10}
                  fullWidth
                  variant="outlined"
                  placeholder={`Count,${poll?.options?.map(o => o.name).join(',') || 'Alice,Bob,Charlie'}\n5,1,2,3\n3,2,1,3\n,3,2,1`}
                  value={importData}
                  onChange={handlePasteDataChange}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }
                  }}
                />
              </>
            )}
            
            {/* Data Preview */}
            {parsedData && !parsedData.hasErrors && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  backgroundColor: 'success.light',
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 1
                }}
              >
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                      Data Preview
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Total Ballots
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {parsedData.ballotCount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Unique Rankings
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {parsedData.uniqueRankings}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        Candidates
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {parsedData.candidateNames.length}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Detected candidates:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {parsedData.candidateNames.map((name, idx) => (
                        <Chip 
                          key={idx} 
                          label={name} 
                          size="small" 
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  backgroundColor: 'error.light',
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 1
                }}
              >
                <Stack spacing={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.dark' }}>
                      Validation Errors
                    </Typography>
                  </Box>
                  
                  {validationErrors.map((error, index) => (
                    <Box key={index} display="flex" alignItems="flex-start" gap={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>
                        •
                      </Typography>
                      <Typography variant="body2" color="error.dark">
                        {error.message}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Please ensure CSV headers exactly match poll option names (case-insensitive)
                  </Typography>
                </Stack>
              </Paper>
            )}
            
            {/* Overwrite Option */}
            {!confirmOverwrite && !validationErrors.length && parsedData && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Replace existing ballots
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Warning: This will delete all existing ballots before importing
                      </Typography>
                    </Stack>
                  }
                />
              </Paper>
            )}
            
            {/* Overwrite Confirmation */}
            {confirmOverwrite && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ 
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                  Confirm Overwrite
                </Typography>
                <Typography variant="body2">
                  This will permanently delete all existing ballots for this poll and replace them with the imported data.
                  This action cannot be undone.
                </Typography>
              </Alert>
            )}
            
            {/* Import Progress */}
            {importing && (
              <Stack spacing={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={importProgress}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="body2" color="text.secondary" align="center">
                  {overwriteExisting ? 'Replacing ballots...' : 'Importing ballots...'} {Math.round(importProgress)}%
                </Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleImportClose} 
            disabled={importing}
            variant="text"
          >
            Cancel
          </Button>
          {confirmOverwrite ? (
            <>
              <Button
                onClick={() => setConfirmOverwrite(false)}
                disabled={importing}
                variant="outlined"
              >
                Back
              </Button>
              <Button
                onClick={handleBulkImport}
                variant="contained"
                color="error"
                disabled={!canImport()}
                startIcon={<FileUploadIcon />}
              >
                Confirm & Replace
              </Button>
            </>
          ) : (
            <Button
              onClick={handleBulkImport}
              variant="contained"
              disabled={!canImport()}
              color={overwriteExisting ? "warning" : "primary"}
              startIcon={<FileUploadIcon />}
            >
              {overwriteExisting ? 'Replace & Import' : 'Import Ballots'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminBulkImportTab;