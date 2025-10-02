import React, { useState, useEffect } from 'react';
import { 
  Container, 
  TextField, 
  Button, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,  // <-- ADD THIS
  Typography,
  Box,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TablePagination,
  InputAdornment
} from '@mui/material';
import { 
  ContentCopy, 
  Search, 
  Delete, 
  AdminPanelSettings,
  HowToVote,
  Refresh,
  Lock,
  LockOpen,
  Email,
  Link as LinkIcon,
  CalendarToday
} from '@mui/icons-material';
import API from '../services/api';

const SuperAdminDashboard = () => {
  const [password, setPassword] = useState('');
  const [polls, setPolls] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, poll: null });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalPolls, setTotalPolls] = useState(0);
  
  const fetchAllPolls = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/all-polls', {
        params: { 
          password,
          limit: rowsPerPage,
          offset: page * rowsPerPage
        }
      });
      setPolls(response.data.polls);
      setTotalPolls(response.data.total_polls);
      setAuthenticated(true);
      setError('');
      
      // Also fetch stats
      const statsResponse = await API.get('/admin/stats', {
        params: { password }
      });
      setStats(statsResponse.data);
    } catch (err) {
      setError('Invalid password or error fetching data');
    } finally {
      setLoading(false);
    }
  };
  
  const searchPolls = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await API.get('/admin/search-poll', {
        params: { 
          password,
          search: searchQuery 
        }
      });
      setSearchResults(response.data.polls);
      setError('');
    } catch (err) {
      setError('Error searching polls');
    } finally {
      setLoading(false);
    }
  };
  
  const deletePoll = async (pollId) => {
    try {
      await API.delete(`/admin/delete-poll/${pollId}`, {
        params: { password }
      });
      setSuccess('Poll deleted successfully');
      setDeleteDialog({ open: false, poll: null });
      fetchAllPolls(); // Refresh the list
    } catch (err) {
      setError('Error deleting poll');
    }
  };
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard`);
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  useEffect(() => {
    if (authenticated) {
      fetchAllPolls();
    }
  }, [page, rowsPerPage]);
  
  if (!authenticated) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <AdminPanelSettings sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
              <Typography variant="h4">
                Super Admin Access
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={3}>
              This area is restricted to system administrators only.
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchAllPolls()}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="contained" 
              fullWidth 
              onClick={fetchAllPolls}
              disabled={loading}
              size="large"
              sx={{ mt: 2 }}
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Paper>
        </Container>
      </Box>
    );
  }
  
  const PollsTable = ({ pollsList }) => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Title</strong></TableCell>
            <TableCell><strong>Short ID</strong></TableCell>
            <TableCell><strong>Slug</strong></TableCell>
            <TableCell><strong>Admin Token</strong></TableCell>
            <TableCell><strong>Owner</strong></TableCell>
            <TableCell><strong>Created</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="center"><strong>Ballots</strong></TableCell>
            <TableCell align="center"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pollsList.map((poll) => (
            <TableRow key={poll.id} hover>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                  {poll.title}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={poll.short_id} 
                  size="small" 
                  onClick={() => copyToClipboard(poll.short_id, 'Short ID')}
                />
              </TableCell>
              <TableCell>
                {poll.slug ? (
                  <Chip 
                    label={poll.slug} 
                    size="small" 
                    color="secondary"
                    onClick={() => copyToClipboard(poll.slug, 'Slug')}
                  />
                ) : '-'}
              </TableCell>
              <TableCell>
                <Tooltip title="Click to copy admin token">
                  <IconButton 
                    size="small"
                    onClick={() => copyToClipboard(poll.admin_token, 'Admin token')}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell>
                {poll.owner_email ? (
                  <Tooltip title={poll.owner_email}>
                    <Chip 
                      icon={<Email fontSize="small" />}
                      label={poll.owner_email.split('@')[0]}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {new Date(poll.created_at).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={poll.status}
                  size="small"
                  color={poll.status === 'active' ? 'success' : 'default'}
                  icon={poll.is_private ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                />
              </TableCell>
              <TableCell align="center">
                <Chip label={poll.ballot_count} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Box display="flex" gap={0.5}>
                  <Tooltip title="Open Admin Panel">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        const adminUrl = `${window.location.origin}/admin/${poll.short_id}?token=${poll.admin_token}`;
                        window.open(adminUrl, '_blank');
                      }}
                    >
                      <AdminPanelSettings fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open Voting Page">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {
                        const voteUrl = `${window.location.origin}/vote/${poll.slug || poll.short_id}`;
                        window.open(voteUrl, '_blank');
                      }}
                    >
                      <HowToVote fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy Admin URL">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const adminUrl = `${window.location.origin}/admin/${poll.short_id}?token=${poll.admin_token}`;
                        copyToClipboard(adminUrl, 'Admin URL');
                      }}
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Poll">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, poll })}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Super Admin Dashboard
          </Typography>
          <Button
            startIcon={<Refresh />}
            onClick={fetchAllPolls}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        
        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Total Polls
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_polls}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Total Ballots
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_ballots}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Active Polls
                  </Typography>
                  <Typography variant="h4">
                    {stats.active_polls}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Private Polls
                  </Typography>
                  <Typography variant="h4">
                    {stats.private_polls}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Last 7 Days
                  </Typography>
                  <Typography variant="h4">
                    {stats.recent_polls_7_days}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="caption">
                    Avg Ballots/Poll
                  </Typography>
                  <Typography variant="h4">
                    {stats.average_ballots_per_poll}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="All Polls" />
            <Tab label="Search" />
          </Tabs>
        </Paper>
        
        {/* Tab Panels */}
        {tabValue === 0 && (
          <>
            <PollsTable pollsList={polls} />
            <TablePagination
              component="div"
              count={totalPolls}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </>
        )}
        
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" gap={2} mb={3}>
              <TextField
                fullWidth
                label="Search by title, ID, slug, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPolls()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={searchPolls}
                disabled={loading}
                startIcon={<Search />}
              >
                Search
              </Button>
            </Box>
            
            {searchResults.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Found {searchResults.length} result(s)
                </Typography>
                <PollsTable pollsList={searchResults} />
              </>
            )}
          </Paper>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, poll: null })}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the poll "{deleteDialog.poll?.title}"?
              This will permanently delete all ballots and data associated with this poll.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, poll: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => deletePoll(deleteDialog.poll?.short_id)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SuperAdminDashboard;