import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
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
  Info as InfoIcon,
} from '@mui/icons-material';
import Papa from 'papaparse';
import API from '../../services/api';

/**
 * Generate matchup column headers from candidates.
 * Returns array of { header: "A vs B", cand1: {id, name}, cand2: {id, name} }
 */
function generateMatchupHeaders(candidates) {
  const matchups = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      matchups.push({
        header: `${candidates[i].name} vs ${candidates[j].name}`,
        cand1: candidates[i],
        cand2: candidates[j],
      });
    }
  }
  return matchups;
}

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

  const matchupHeaders = useMemo(
    () => generateMatchupHeaders(poll?.options || []),
    [poll?.options]
  );

  const exampleCsv = useMemo(() => {
    if (!poll?.options || poll.options.length < 2) return '';
    const headers = ['Count', ...matchupHeaders.map(m => m.header)];
    const row1 = [5, ...matchupHeaders.map(m => m.cand1.name)];
    const row2 = [3, ...matchupHeaders.map(m => m.cand2.name)];
    const row3 = [2, ...matchupHeaders.map((m, i) => i === 0 ? 'both' : '')];
    return [headers, row1, row2, row3].map(r => r.join(',')).join('\n');
  }, [poll?.options, matchupHeaders]);

  /**
   * Parse a CSV cell value into a pairwise choice.
   * Returns 'cand1', 'cand2', 'tie', or null (skip).
   */
  const parseCellValue = (value, cand1Name, cand2Name) => {
    if (!value || !value.trim()) return null; // blank = skip
    const v = value.trim().toLowerCase();
    if (v === 'both') return 'tie';
    if (v === cand1Name.toLowerCase()) return 'cand1';
    if (v === cand2Name.toLowerCase()) return 'cand2';
    return 'invalid';
  };

  const validateAndParseCSV = (csvText) => {
    const errors = [];
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      errors.push({ message: 'CSV must have a header row and at least one data row' });
      return { errors, preview: null };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['Count', ...matchupHeaders.map(m => m.header)];

    // Validate headers match expected matchups
    if (headers.length !== expectedHeaders.length) {
      errors.push({
        message: `Expected ${expectedHeaders.length} columns (Count + ${matchupHeaders.length} matchups), got ${headers.length}`,
      });
    }

    // Check each matchup header
    for (let i = 1; i < expectedHeaders.length; i++) {
      if (i < headers.length && headers[i].toLowerCase() !== expectedHeaders[i].toLowerCase()) {
        errors.push({
          message: `Column ${i + 1}: expected "${expectedHeaders[i]}", got "${headers[i]}"`,
        });
      }
    }

    if (errors.length > 0) return { errors, preview: null };

    // Parse data rows
    const rows = lines.slice(1).filter(line => line.trim());
    let totalBallots = 0;
    let uniquePatterns = 0;
    let cellErrors = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const values = rows[rowIdx].split(',').map(v => v.trim());
      const count = values[0] ? parseInt(values[0]) : 1;
      if (isNaN(count) || count <= 0) {
        cellErrors.push(`Row ${rowIdx + 2}: invalid count "${values[0]}"`);
        continue;
      }

      // Validate each matchup cell
      for (let colIdx = 0; colIdx < matchupHeaders.length; colIdx++) {
        const cellValue = values[colIdx + 1] || '';
        const result = parseCellValue(
          cellValue,
          matchupHeaders[colIdx].cand1.name,
          matchupHeaders[colIdx].cand2.name
        );
        if (result === 'invalid') {
          cellErrors.push(
            `Row ${rowIdx + 2}, "${matchupHeaders[colIdx].header}": "${cellValue}" is not a valid choice. Use "${matchupHeaders[colIdx].cand1.name}", "${matchupHeaders[colIdx].cand2.name}", "both", or leave empty.`
          );
        }
      }

      totalBallots += count;
      uniquePatterns++;
    }

    if (cellErrors.length > 0) {
      // Show at most 5 cell errors
      cellErrors.slice(0, 5).forEach(e => errors.push({ message: e }));
      if (cellErrors.length > 5) {
        errors.push({ message: `...and ${cellErrors.length - 5} more errors` });
      }
    }

    return {
      errors,
      preview: errors.length === 0 ? {
        matchupCount: matchupHeaders.length,
        ballotCount: totalBallots,
        uniquePatterns,
      } : null,
    };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      setValidationErrors([]);

      Papa.parse(file, {
        complete: (results) => {
          const csvText = results.data.map(row => row.join(',')).join('\n');
          setImportData(csvText);
          const { errors, preview } = validateAndParseCSV(csvText);
          setValidationErrors(errors);
          setParsedData(preview);
        },
        error: () => {
          onError('Failed to parse CSV file');
        },
      });
    }
  };

  const handlePasteDataChange = (e) => {
    const text = e.target.value;
    setImportData(text);
    setValidationErrors([]);

    if (text.trim()) {
      const { errors, preview } = validateAndParseCSV(text);
      setValidationErrors(errors);
      setParsedData(preview);
    } else {
      setParsedData(null);
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
    if (overwriteExisting && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    setImporting(true);

    try {
      // Clear existing if requested
      if (overwriteExisting) {
        const authData = getAuthData();
        try {
          await API.delete(`/ballots/poll/${poll.id || poll.short_id}/clear?admin_token=${authData.admin_token}`);
        } catch (clearError) {
          console.error('Error clearing ballots:', clearError);
        }
      }

      const lines = importData.trim().split('\n');
      const ballots = [];
      let totalVoterCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (!values[0] && values.length <= 1) continue;

        const count = values[0] ? parseInt(values[0]) : 1;
        if (isNaN(count) || count <= 0) continue;

        const pairwiseChoices = [];

        for (let colIdx = 0; colIdx < matchupHeaders.length; colIdx++) {
          const cellValue = values[colIdx + 1] || '';
          const choice = parseCellValue(
            cellValue,
            matchupHeaders[colIdx].cand1.name,
            matchupHeaders[colIdx].cand2.name
          );

          if (choice === 'invalid') continue;

          pairwiseChoices.push({
            cand1_id: matchupHeaders[colIdx].cand1.id,
            cand2_id: matchupHeaders[colIdx].cand2.id,
            choice: choice || 'neither',
          });
        }

        if (pairwiseChoices.length > 0) {
          ballots.push({
            pairwise_choices: pairwiseChoices,
            count: count,
          });
          totalVoterCount += count;
        }

        setImportProgress((i / lines.length) * 100);
      }

      if (ballots.length === 0) {
        throw new Error('No valid ballots found in CSV');
      }

      const authData = getAuthData();
      const requestData = {
        poll_id: poll.id || poll.short_id,
        admin_token: authData.admin_token,
        ballots: ballots,
      };

      const response = await API.post('/ballots/bulk-import', requestData);

      logAdminAction(
        'BULK_IMPORT',
        `Imported ${response.data.total_votes || ballots.length} ballots${overwriteExisting ? ' (replaced existing)' : ''}`,
        {
          method: importMethod,
          count: response.data.total_votes || ballots.length,
          totalVoters: totalVoterCount,
          filename: importFile?.name,
          overwrite: overwriteExisting,
        }
      );

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
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Import Ballots
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Import multiple ballots at once using CSV format. Each row represents a unique set of pairwise choices with a voter count.
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
                },
              }}
              onClick={() => handleImportOpen('csv')}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: 1,
                    backgroundColor: 'primary.light',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.9,
                  }}
                >
                  <FileUploadIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Upload CSV File</Typography>
                  <Typography variant="body2" color="text.secondary">Select a file from your computer</Typography>
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
                },
              }}
              onClick={() => handleImportOpen('paste')}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: 1,
                    backgroundColor: 'primary.light',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.9,
                  }}
                >
                  <PasteIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Paste CSV Data</Typography>
                  <Typography variant="body2" color="text.secondary">Copy and paste from spreadsheet</Typography>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>CSV Format</Typography>
            </Box>

            <Stack spacing={1.5}>
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>1.</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Header row:</strong> Count, then one column per matchup (e.g., "{matchupHeaders[0]?.header || 'A vs B'}")
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>2.</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>First column:</strong> Number of voters with this pattern (blank = 1)
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>3.</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Each matchup cell:</strong> The preferred candidate's name, "<strong>both</strong>" for no preference, or leave empty to skip
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1 }} />

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
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                }}
              >
                <Box component="pre" sx={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre' }}>
                  {exampleCsv}
                </Box>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Empty cells mean the voter skipped that matchup. "both" means no preference between the two candidates.
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
          sx: { border: '1px solid', borderColor: 'divider' },
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
                        '&:hover': { borderStyle: 'solid' },
                      }}
                    >
                      {importFile ? 'Change File' : 'Select CSV File'}
                    </Button>
                  </label>
                </Box>

                {importFile && (
                  <Paper
                    elevation={0}
                    sx={{ p: 2, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FileIcon sx={{ color: 'text.secondary' }} />
                      <Box flex={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{importFile.name}</Typography>
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
                  placeholder={exampleCsv}
                  value={importData}
                  onChange={handlePasteDataChange}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </>
            )}

            {/* Data Preview */}
            {parsedData && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'success.light',
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: 1,
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
                      <Typography variant="caption" color="text.secondary">Total Ballots</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{parsedData.ballotCount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Unique Patterns</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{parsedData.uniquePatterns}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Matchups</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{parsedData.matchupCount}</Typography>
                    </Grid>
                  </Grid>
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
                  borderRadius: 1,
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
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24 }}>•</Typography>
                      <Typography variant="body2" color="error.dark">{error.message}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* Overwrite Option */}
            {!confirmOverwrite && !validationErrors.length && parsedData && (
              <Paper
                elevation={0}
                sx={{ p: 2, backgroundColor: 'grey.50', border: '1px solid', borderColor: 'divider' }}
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Replace existing ballots</Typography>
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
              <Alert severity="warning" icon={<WarningIcon />} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }} gutterBottom>
                  Confirm Overwrite
                </Typography>
                <Typography variant="body2">
                  This will permanently delete all existing ballots and replace them with the imported data.
                  This action cannot be undone.
                </Typography>
              </Alert>
            )}

            {/* Import Progress */}
            {importing && (
              <Stack spacing={1}>
                <LinearProgress variant="determinate" value={importProgress} sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  {overwriteExisting ? 'Replacing ballots...' : 'Importing ballots...'} {Math.round(importProgress)}%
                </Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleImportClose} disabled={importing} variant="text">Cancel</Button>
          {confirmOverwrite ? (
            <>
              <Button onClick={() => setConfirmOverwrite(false)} disabled={importing} variant="outlined">Back</Button>
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
              color={overwriteExisting ? 'warning' : 'primary'}
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
