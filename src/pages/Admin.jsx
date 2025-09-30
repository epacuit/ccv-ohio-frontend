import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  TextField,
  useMediaQuery,
  useTheme,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  BarChart as ChartIcon,
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  ExitToApp as LogoutIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  PlayArrow as OpenIcon,
  Stop as CloseIcon,
  Circle as CircleIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import API from '../services/api';

// Import shared components
import PollForm from '../components/shared/PollForm';
import EmailListInput from '../components/shared/EmailListInput';
import VoterManagement from '../components/shared/VoterManagement';
import AdminBulkImportTab from '../components/admin/AdminBulkImportTab';

dayjs.extend(relativeTime);

// Statistics Component
const StatisticsPanel = ({ statistics, poll }) => {
  if (!statistics || statistics.total_votes === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">No votes have been submitted yet.</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Statistics will appear here once voting begins.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Summary Stats Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Ballots
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5 }}>
                {statistics.total_votes}
              </Typography>
            </Paper>
          </Grid>
          
          {statistics.voting_rate > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Voting Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {statistics.voting_rate.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  per hour
                </Typography>
              </Paper>
            </Grid>
          )}
          
          {statistics.first_vote_time && statistics.last_vote_time && (
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Active For
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {(() => {
                    const start = dayjs(statistics.first_vote_time);
                    const end = dayjs(statistics.last_vote_time);
                    const minutes = end.diff(start, 'minute');
                    const hours = end.diff(start, 'hour');
                    const days = end.diff(start, 'day');
                    
                    if (days > 1) return `${days}d`;
                    if (days === 1) return `1d`;
                    if (hours > 1) return `${hours}h`;
                    if (hours === 1) return `1h`;
                    if (minutes > 1) return `${minutes}m`;
                    return 'New';
                  })()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(() => {
                    const start = dayjs(statistics.first_vote_time);
                    const end = dayjs(statistics.last_vote_time);
                    const days = end.diff(start, 'day');
                    const hours = end.diff(start, 'hour');
                    
                    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
                    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
                    return 'just started';
                  })()}
                </Typography>
              </Paper>
            </Grid>
          )}

          {statistics.last_vote_time && (
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Latest Ballot
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {dayjs(statistics.last_vote_time).fromNow().replace(' ago', '')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ago
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
        
        {/* Activity Timeline */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Activity Timeline
          </Typography>
          
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Stack divider={<Divider />}>
              {/* Poll Created */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main',
                    flexShrink: 0
                  }} 
                />
                <Box flex={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Poll Created
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {poll?.created_at ? dayjs(poll.created_at).format('MMM D, YYYY at h:mm A') : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
              
              {/* First Vote */}
              {statistics.first_vote_time && (
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'success.main',
                      flexShrink: 0
                    }} 
                  />
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      First Vote Received
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(statistics.first_vote_time).format('MMM D, YYYY at h:mm A')}
                      {' • '}
                      {dayjs(statistics.first_vote_time).fromNow()}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Latest Vote */}
              {statistics.last_vote_time && statistics.last_vote_time !== statistics.first_vote_time && (
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'info.main',
                      flexShrink: 0
                    }} 
                  />
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Latest Ballot Received
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(statistics.last_vote_time).format('MMM D, YYYY at h:mm A')}
                      {' • '}
                      {dayjs(statistics.last_vote_time).fromNow()}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Poll Closing */}
              {poll?.closing_datetime && (
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: dayjs(poll.closing_datetime).isAfter(dayjs()) ? 'warning.main' : 'text.disabled',
                      flexShrink: 0
                    }} 
                  />
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Poll {dayjs(poll.closing_datetime).isAfter(dayjs()) ? 'Closes' : 'Closed'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(poll.closing_datetime).format('MMM D, YYYY at h:mm A')}
                      {dayjs(poll.closing_datetime).isAfter(dayjs()) && (
                        <>
                          {' • '}
                          {dayjs(poll.closing_datetime).fromNow()}
                        </>
                      )}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Voting Pattern Analysis - Optional future enhancement */}
        {statistics.hourly_distribution && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Voting Patterns
            </Typography>
            <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Peak voting times and distribution analysis would appear here
              </Typography>
            </Paper>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Admin = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const fullScreenDialogs = useMediaQuery(theme.breakpoints.down('sm'));
  
  const urlParams = new URLSearchParams(location.search);
  const tokenFromUrl = urlParams.get('token');
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [poll, setPoll] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [pollNotFound, setPollNotFound] = useState(false);
  
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDialog, setAuthDialog] = useState(false);
  const [adminToken, setAdminToken] = useState(tokenFromUrl || '');
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editedPoll, setEditedPoll] = useState(null);
  
  // Dialogs
  const [deletePollDialog, setDeletePollDialog] = useState(false);
  const [clearBallotsDialog, setClearBallotsDialog] = useState(false);
  const [editWarningDialog, setEditWarningDialog] = useState(false);

  // Initialize
  useEffect(() => {
    if (tokenFromUrl) {
      setAdminToken(tokenFromUrl);
      setIsAuthenticated(true);
      loadPollData();
      loadStatistics();
    } else {
      setAuthDialog(true);
      setLoading(false);
    }
  }, []);

  // Auto-refresh statistics
  useEffect(() => {
    if (!isAuthenticated || pollNotFound) return;
    
    const interval = setInterval(() => {
      loadStatistics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab, pollNotFound]);

  const loadPollData = async () => {
    setLoading(true);
    setPollNotFound(false);
    try {
      const response = await API.get(`/polls/${pollId}`);
      
      // Format poll data properly for PollForm component
      const formattedPoll = {
        ...response.data,
        options: response.data.candidates?.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          image_url: c.image_url
        })) || [],
        closing_datetime: response.data.closing_at ? dayjs(response.data.closing_at) : null,
        is_completed: response.data.status === 'closed',
        settings: response.data.settings || {
          allow_ties: true,
          require_complete_ranking: false,
          randomize_options: false,
          allow_write_in: false,
          show_detailed_results: true,
          show_rankings: true,
          results_visibility: 'public',
          can_view_before_close: false,
        }
      };
      
      setPoll(formattedPoll);
      setEditedPoll(formattedPoll);
    } catch (err) {
      console.error('Failed to load poll data:', err);
      if (err.response?.status === 404) {
        setPollNotFound(true);
        setError(`Poll "${pollId}" not found. Please check the URL.`);
      } else {
        setError('Failed to load poll data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!adminToken || pollNotFound) return;
    
    try {
      const response = await API.get(`/polls/${pollId}/statistics?admin_token=${adminToken}`);
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      // Don't show error for statistics, it's not critical
      if (err.response?.status !== 404) {
        // Only log non-404 errors
        console.error('Statistics error:', err.message);
      }
    }
  };

  const handleTogglePollStatus = async () => {
    try {
      const response = await API.post(`/polls/${pollId}/toggle-status?admin_token=${adminToken}`);
      setPoll({ ...poll, status: response.data.status, is_completed: response.data.status === 'closed' });
      setEditedPoll({ ...editedPoll, status: response.data.status, is_completed: response.data.status === 'closed' });
      setSuccess(`Poll ${response.data.status}`);
      await loadStatistics();
    } catch (err) {
      setError('Failed to toggle poll status');
    }
  };

  const handlePollChange = (updates) => {
    setEditedPoll({ ...editedPoll, ...updates });
  };

  const handleEnterEditMode = () => {
    if (statistics?.total_votes > 0) {
      setEditWarningDialog(true);
    } else {
      setEditMode(true);
    }
  };

  const handleConfirmEdit = () => {
    setEditWarningDialog(false);
    setEditMode(true);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      if (statistics?.total_votes > 0) {
        const originalCandidateIds = poll.options.map(opt => opt.id).sort();
        const editedCandidateIds = editedPoll.options.map(opt => opt.id).filter(id => id).sort();
        
        if (JSON.stringify(originalCandidateIds) !== JSON.stringify(editedCandidateIds)) {
          setError('Cannot add or remove candidates after voting has started. Only name and description edits are allowed.');
          setSaving(false);
          return;
        }
      }
      
      const updateData = {
        title: editedPoll.title,
        description: editedPoll.description,
        candidates: editedPoll.options.map((opt, idx) => ({
          id: opt.id || `candidate-${idx}`,
          name: opt.name,
          description: opt.description,
          image_url: opt.image_url
        })),
        settings: editedPoll.settings,
        closing_at: editedPoll.closing_datetime ? editedPoll.closing_datetime.toISOString() : null,
      };
      
      await API.put(`/polls/${pollId}?admin_token=${adminToken}`, updateData);
      
      setPoll(editedPoll);
      setEditMode(false);
      setSuccess('Poll updated successfully');
      await loadPollData();
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePoll = async () => {
    try {
      await API.delete(`/polls/${pollId}?admin_token=${adminToken}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete poll');
    }
  };

  const handleClearBallots = async () => {
    try {
      await API.delete(`/ballots/poll/${pollId}/clear?admin_token=${adminToken}`);
      setSuccess('All ballots cleared');
      setClearBallotsDialog(false);
      await loadStatistics();
    } catch (err) {
      setError('Failed to clear ballots');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await API.get(`/polls/${pollId}/export?admin_token=${adminToken}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poll_${pollId}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess('Export downloaded successfully');
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const copyAdminLink = () => {
    const adminLink = `${window.location.origin}/admin/${pollId}?token=${adminToken}`;
    navigator.clipboard.writeText(adminLink);
    setSuccess('Admin link copied to clipboard');
  };

  // Auth Dialog
  if (authDialog && !isAuthenticated) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
          <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <LockIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Admin Authentication
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Enter the admin token to access poll administration. This was provided when you created the poll.
              </Alert>
              
              <TextField
                fullWidth
                type="password"
                label="Admin Token"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && adminToken) {
                    setIsAuthenticated(true);
                    setAuthDialog(false);
                    loadPollData();
                    loadStatistics();
                  }
                }}
                sx={{ mb: 3 }}
                autoFocus
              />
              
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(`/vote/${pollId}`)}
                >
                  Back to Poll
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setIsAuthenticated(true);
                    setAuthDialog(false);
                    loadPollData();
                    loadStatistics();
                  }}
                  disabled={!adminToken}
                >
                  Authenticate
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </LocalizationProvider>
    );
  }

  // Poll Not Found State
  if (pollNotFound) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
          <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Poll Not Found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                The poll "{pollId}" doesn't exist or may have been deleted.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/create')}
                >
                  Create Poll
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </LocalizationProvider>
    );
  }

  // Main Admin Interface
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {loading ? (
            <Box textAlign="center" py={8}>
              <CircularProgress />
              <Typography variant="body1" color="text.secondary" mt={2}>
                Loading admin panel...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Clean Header */}
              <Box sx={{ mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {poll?.title}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircleIcon 
                        sx={{ 
                          fontSize: 8, 
                          color: poll?.is_completed ? 'text.disabled' : 'success.main' 
                        }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {poll?.is_completed ? 'Poll Closed' : 'Poll Active'}
                      </Typography>
                      {poll?.is_private && (
                        <>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Private Poll
                          </Typography>
                        </>
                      )}
                      {statistics?.total_votes > 0 && (
                        <>
                          <Typography variant="body2" color="text.secondary">•</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {statistics.total_votes} {statistics.total_votes === 1 ? 'vote' : 'votes'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setIsAuthenticated(false);
                      navigate(`/vote/${pollId}`);
                    }}
                    startIcon={<LogoutIcon />}
                  >
                    Exit Admin
                  </Button>
                </Box>
                
                {/* Clean Action Bar */}
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant={poll?.is_completed ? 'contained' : 'outlined'}
                    size="small"
                    onClick={handleTogglePollStatus}
                    startIcon={poll?.is_completed ? <OpenIcon /> : <CloseIcon />}
                  >
                    {poll?.is_completed ? 'Reopen Poll' : 'Close Poll'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/vote/${poll?.short_id || pollId}`)}
                  >
                    View Poll
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/results/${poll?.short_id || pollId}`)}
                  >
                    View Results
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={copyAdminLink}
                  >
                    Copy Admin Link
                  </Button>
                  
                  {statistics?.total_votes > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={() => setClearBallotsDialog(true)}
                    >
                      Clear Ballots
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setDeletePollDialog(true)}
                  >
                    Delete Poll
                  </Button>
                </Stack>
              </Box>

              {/* Clean Tabs */}
              <Paper sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, v) => setActiveTab(v)}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 500,
                    }
                  }}
                >
                  <Tab label="Settings" icon={<SettingsIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                  {poll?.is_private && (
                    <Tab label="Voters" icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                  )}
                  <Tab label="Statistics" icon={<ChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                  <Tab label="Import" icon={<UploadIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                </Tabs>
                
                {/* Settings Tab */}
                <TabPanel value={activeTab} index={0}>
                  <Box sx={{ p: 3 }}>
                    {editMode ? (
                      <>
                        {statistics?.total_votes > 0 && (
                          <Alert 
                            severity="warning" 
                            sx={{ mb: 3 }}
                            icon={<WarningIcon />}
                          >
                            <Typography variant="subtitle2" fontWeight="bold">
                              This poll has {statistics.total_votes} votes already submitted
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              • Cannot change: candidate names, ties setting, complete ranking requirement
                              <br />• Can still edit: descriptions, title, randomize/write-in settings, closing date
                            </Typography>
                          </Alert>
                        )}
                        
                        <PollForm
                          poll={editedPoll}
                          onChange={handlePollChange}
                          isEditing={true}
                          canModifyOptions={statistics?.total_votes > 0 ? false : true}
                          errors={{}}
                          isPrivatePoll={editedPoll?.is_private}
                          showCompletedToggle={false}
                          refs={{ current: {} }}
                        />
                        
                        <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEditMode(false);
                              setEditedPoll(poll);
                            }}
                            startIcon={<CancelIcon />}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSaveChanges}
                            disabled={saving}
                            startIcon={<SaveIcon />}
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <>
                        {/* View Mode */}
                        <Stack spacing={3}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Description
                            </Typography>
                            <Typography>{poll?.description || 'No description'}</Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Candidates ({poll?.options?.length || 0})
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              {poll?.options?.map((opt) => (
                                <Chip key={opt.id} label={opt.name} size="small" />
                              ))}
                            </Stack>
                          </Box>
                          
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Configuration
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  Type: <strong>{poll?.is_private ? 'Private' : 'Public'}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  Allow ties: <strong>{poll?.settings?.allow_ties ? 'Yes' : 'No'}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  Complete ranking required: <strong>{poll?.settings?.require_complete_ranking ? 'Yes' : 'No'}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="body2">
                                  Write-ins allowed: <strong>{poll?.settings?.allow_write_in ? 'Yes' : 'No'}</strong>
                                </Typography>
                              </Grid>
                              {poll?.closing_datetime && (
                                <Grid item xs={12}>
                                  <Typography variant="body2">
                                    Closing: <strong>{dayjs(poll.closing_datetime).format('MMMM D, YYYY h:mm A')}</strong>
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Stack>
                        
                        <Box mt={3}>
                          <Button
                            variant="contained"
                            onClick={handleEnterEditMode}
                            startIcon={<EditIcon />}
                          >
                            Edit Settings
                          </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                </TabPanel>
                
                {/* Voters Tab (for private polls) */}
                {poll?.is_private && (
                  <TabPanel value={activeTab} index={1}>
                    <Box sx={{ p: 3 }}>
                      <VoterManagement
                        pollId={pollId}
                        pollShortId={poll.short_id}
                        adminToken={adminToken}
                        onUpdate={loadStatistics}
                      />
                    </Box>
                  </TabPanel>
                )}
                
                {/* Statistics Tab */}
                <TabPanel value={activeTab} index={poll?.is_private ? 2 : 1}>
                  <StatisticsPanel statistics={statistics} poll={poll} />
                </TabPanel>
                
                {/* Import Tab */}
                <TabPanel value={activeTab} index={poll?.is_private ? 3 : 2}>
                  <Box sx={{ p: 3 }}>
                    <AdminBulkImportTab
                      poll={poll}
                      onImportComplete={() => {
                        setSuccess('Ballots imported successfully');
                        loadStatistics();
                      }}
                      onError={(error) => setError(error)}
                      logAdminAction={(action, message, details) => {
                        console.log('Admin action:', action, message, details);
                      }}
                      getAuthData={() => ({ admin_token: adminToken })}
                    />
                  </Box>
                </TabPanel>
              </Paper>
            </>
          )}
          
          {/* Success/Error Snackbars */}
          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess('')}
          >
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Snackbar>
          
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError('')}
          >
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Snackbar>
          
          {/* Delete Poll Dialog */}
          <Dialog
            open={deletePollDialog}
            onClose={() => setDeletePollDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Delete Poll?</DialogTitle>
            <DialogContent>
              <Typography>
                This will permanently delete the poll and all {statistics?.total_votes || 0} votes. This cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletePollDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeletePoll} color="error">
                Delete Poll
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Clear Ballots Dialog */}
          <Dialog
            open={clearBallotsDialog}
            onClose={() => setClearBallotsDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Clear All Ballots?</DialogTitle>
            <DialogContent>
              <Typography>
                This will delete all {statistics?.total_votes || 0} ballots. The poll structure will remain intact.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setClearBallotsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleClearBallots} color="warning">
                Clear Ballots
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Edit Warning Dialog */}
          <Dialog
            open={editWarningDialog}
            onClose={() => setEditWarningDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Edit Poll With Existing Votes</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This poll has {statistics?.total_votes || 0} votes already submitted.
              </Alert>
              
              <Typography paragraph>
                To maintain election integrity, some fields are locked:
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>❌ CANNOT change:</strong>
              </Typography>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Typography variant="body2">
                  • Candidate names (would invalidate votes)
                  <br />• Add or remove candidates
                  <br />• Voting rules (ties, complete ranking, etc.)
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                <strong>✅ CAN still change:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Candidate descriptions
                  <br />• Poll title and description
                  <br />• Closing date/time
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditWarningDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmEdit} color="warning">
                Continue
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default Admin;