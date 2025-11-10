import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Alert,
  Divider,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  AdminPanelSettings as AdminIcon,
  Poll as PollIcon,
  HowToVote as VoteIcon,
  Share as ShareIcon,
  Launch as LaunchIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import API from '../services/api';

const PollCreatedSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pollId, pollTitle, authMethod, adminToken, creatorEmail, voterEmails = [], slug } = location.state || {};
  
  const [copiedField, setCopiedField] = useState('');
  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  
  const [addingVoters, setAddingVoters] = useState(false);
  const [votersAdded, setVotersAdded] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [voterStats, setVoterStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const embedded = searchParams.get('embedded') === 'true';
    setIsEmbedded(embedded);
  }, [location.search]);

  // Generate URLs - use slug if available
  const baseUrl = window.location.origin;
  const pollIdentifier = slug || pollId;
  const voteUrl = `${baseUrl}/vote/${pollIdentifier}`;
  const resultsUrl = `${baseUrl}/results/${pollIdentifier}`;
  const adminUrl = adminToken ? `${baseUrl}/admin/${pollId}?token=${adminToken}` : `${baseUrl}/admin/${pollId}`;
  const myPollsUrl = creatorEmail ? `${baseUrl}/my-polls/${encodeURIComponent(creatorEmail)}` : null;
  const shortUrl = slug ? `${baseUrl}/vote/${pollId}` : null;

  useEffect(() => {
    const fetchPollData = async () => {
      if (!pollId) return;
      
      try {
        const response = await API.get(`/polls/${pollId}`);
        setPollData(response.data);
      } catch (error) {
        console.error('Error fetching poll data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [pollId]);

  useEffect(() => {
    const addInitialVoters = async () => {
      if (!pollData || !pollData.is_private || !voterEmails.length || votersAdded || !adminToken) {
        return;
      }

      setAddingVoters(true);
      try {
        const response = await API.post(`/polls/${pollId}/voters`, {
          admin_token: adminToken,
          emails: voterEmails,
          send_invitations: true  // CRITICAL: Send invitations when adding voters
        });
        
        setVotersAdded(true);
        
        const added = response.data.added?.length || 0;
        const alreadyExisted = response.data.already_existed?.length || 0;
        const duplicates = response.data.duplicates?.length || 0;
        
        setVoterStats({
          total: voterEmails.length,
          added: added,
          alreadyExisted: alreadyExisted,
          duplicates: duplicates
        });
        
        // Build success message
        let message = '';
        if (alreadyExisted > 0) {
          message = `Sent invitations to ${alreadyExisted} voter(s)`;
          if (added > 0) message = `Added ${added} new voter(s) and sent invitations to ${alreadyExisted} existing voter(s)`;
        } else if (added > 0) {
          message = `Added ${added} voter(s) and sent invitations`;
        }
        if (duplicates > 0) {
          message += ` (${duplicates} already invited)`;
        }
        
        setSuccess(message || response.data.message);
      } catch (err) {
        console.error('Failed to add voters:', err);
        setError('Failed to add voters. You can add them manually in the admin panel.');
      } finally {
        setAddingVoters(false);
      }
    };

    addInitialVoters();
  }, [pollData, voterEmails, pollId, adminToken, votersAdded]);

  const handleSendInvitations = async () => {
    if (!adminToken) {
      setError('Admin token required to send invitations');
      return;
    }

    setSendingInvites(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await API.post(`/polls/${pollId}/send-invitations`, {
        admin_token: adminToken,
        emails: []
      });
      
      // Use the actual message from the backend (will show correct provider)
      const message = response.data.message || `Sent ${response.data.sent_to.length} invitation(s)`;
      setSuccess(message);
    } catch (err) {
      console.error('Failed to send invitations:', err);
      setError('Failed to send invitations. Please check the admin panel or try again later.');
    } finally {
      setSendingInvites(false);
    }
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!pollId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No poll information found. Please create a new poll.
        </Alert>
      </Container>
    );
  }

  const isPublicPoll = !loading && pollData && !pollData.is_private;
  const isPrivatePoll = !loading && pollData && pollData.is_private;

  return (
    <Box sx={{mt: isEmbedded ? 0 : '134.195px',  minHeight: '100vh' }}>
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mr: 2 }} />
          <Box flex={1}>
            <Typography variant="h4" component="h1">
              Poll Created Successfully!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {pollTitle && `"${pollTitle}"`}
            </Typography>
          </Box>
          <Chip
            icon={isPublicPoll ? <PublicIcon /> : <LockIcon />}
            label={isPublicPoll ? 'Public Poll' : 'Private Poll'}
            color={isPublicPoll ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        <Alert severity="success" sx={{ mb: 3 }}>
          Your poll has been created and is ready to receive votes. 
          {isPublicPoll ? ' Share the voting link below with participants.' : ' Manage your voters and send invitations below.'}
        </Alert>

        {isPrivatePoll && voterEmails.length > 0 && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonAddIcon sx={{ mr: 1, color: 'text.secondary' }} />
                Voter Management
              </Typography>
              
              {addingVoters && (
                <Box display="flex" alignItems="center" gap={2} p={2}>
                  <CircularProgress size={20} />
                  <Typography>Adding voters to your private poll...</Typography>
                </Box>
              )}
              
              {votersAdded && voterStats && (
                <Card variant="outlined" sx={{ backgroundColor: '#fafafa', borderColor: '#e0e0e0', mb: 2 }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {voterStats.alreadyExisted > 0 && (
                        <>
                          <strong>{voterStats.alreadyExisted} invitation(s)</strong> sent to existing voters.
                          {voterStats.added > 0 && ` ${voterStats.added} new voter(s) added.`}
                        </>
                      )}
                      {voterStats.alreadyExisted === 0 && voterStats.added > 0 && (
                        <><strong>{voterStats.added} voter(s)</strong> added and invitations sent.</>
                      )}
                      {voterStats.duplicates > 0 && ` (${voterStats.duplicates} already invited, skipped)`}
                    </Typography>
                    
                    <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1, mb: 2 }}>
                      <List dense>
                        {voterEmails.slice(0, 5).map((email, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon>
                              <EmailIcon fontSize="small" color="action" />
                            </ListItemIcon>
                            <ListItemText primary={email} />
                          </ListItem>
                        ))}
                        {voterEmails.length > 5 && (
                          <ListItem>
                            <ListItemText 
                              primary={`...and ${voterEmails.length - 5} more`}
                              sx={{ pl: 5, color: 'text.secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        startIcon={sendingInvites ? <CircularProgress size={16} /> : <SendIcon />}
                        onClick={handleSendInvitations}
                        disabled={sendingInvites}
                        fullWidth
                        sx={{
                          backgroundColor: '#1976d2',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          }
                        }}
                      >
                        {sendingInvites ? 'Sending...' : 'Send Email Invitations'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<AdminIcon />}
                        onClick={() => window.open(adminUrl, '_blank')}
                        fullWidth
                        sx={{ 
                          borderColor: '#bdbdbd',
                          color: 'text.primary'
                        }}
                      >
                        Manage in Admin Panel
                      </Button>
                    </Stack>
                    
                    {!sendingInvites && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Note: Emails will appear in MailHog at http://localhost:8025
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
            </Box>
            <Divider sx={{ my: 3 }} />
          </>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<VoteIcon />}
              endIcon={<LaunchIcon />}
              onClick={() => window.open(voteUrl, '_blank')}
              fullWidth
              sx={{ 
                py: 1.5,
                backgroundColor: 'success.main',
                '&:hover': {
                  backgroundColor: 'success.dark',
                }
              }}
            >
              Go to Voting Page
            </Button>
            <Button
              variant="contained"
              startIcon={<PollIcon />}
              endIcon={<LaunchIcon />}
              onClick={() => window.open(resultsUrl, '_blank')}
              fullWidth
              sx={{ 
                py: 1.5,
                backgroundColor: 'hsl(8.96, 78.57%, 38.43%)',
                '&:hover': {
                  backgroundColor: 'hsl(8.96, 78.57%, 33%)',
                }
              }}
            >
              View Results
            </Button>
            <Button
              variant="contained"
              startIcon={<AdminIcon />}
              endIcon={<LaunchIcon />}
              onClick={() => window.open(adminUrl, '_blank')}
              fullWidth
              sx={{ 
                py: 1.5,
                backgroundColor: 'grey.600',
                '&:hover': {
                  backgroundColor: 'grey.700',
                }
              }}
            >
              Admin Dashboard
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* HIGHLIGHTED ADMIN LINK SECTION */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminIcon sx={{ mr: 1, color: 'warning.main' }} />
            Admin Link - Save This!
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> Save this admin link to manage your poll settings, view detailed analytics, and control your poll. You'll need it to make any changes later.
          </Alert>
          <Card variant="outlined" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.08)', borderColor: 'warning.main' }}>
            <CardContent>
              <TextField
                fullWidth
                value={adminUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copiedField === 'admin' ? 'Copied!' : 'Copy admin link'}>
                        <IconButton
                          onClick={() => copyToClipboard(adminUrl, 'admin')}
                          edge="end"
                          color={copiedField === 'admin' ? 'success' : 'default'}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  sx: {
                    fontFamily: 'monospace',
                    backgroundColor: 'background.paper',
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                💡 Tip: Bookmark this page or save the admin link. Without it, you won't be able to modify poll settings or add/remove voters.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* HIGHLIGHTED VOTING LINK SECTION */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <VoteIcon sx={{ mr: 1, color: 'success.main' }} />
            Voting Link
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            {isPublicPoll 
              ? 'Share this link with anyone you want to vote in your poll.'
              : 'Share this link with your invited voters so they can cast their ballots.'}
          </Alert>
          <Card variant="outlined" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.08)', borderColor: 'success.main' }}>
            <CardContent>
              <TextField
                fullWidth
                value={voteUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copiedField === 'vote' ? 'Copied!' : 'Copy voting link'}>
                        <IconButton
                          onClick={() => copyToClipboard(voteUrl, 'vote')}
                          edge="end"
                          color={copiedField === 'vote' ? 'success' : 'default'}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  sx: {
                    fontFamily: 'monospace',
                    backgroundColor: 'background.paper',
                  }
                }}
              />
              {slug && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Short link:
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={shortUrl}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={copiedField === 'short' ? 'Copied!' : 'Copy short link'}>
                            <IconButton
                              onClick={() => copyToClipboard(shortUrl, 'short')}
                              edge="end"
                              size="small"
                              color={copiedField === 'short' ? 'success' : 'default'}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                      sx: {
                        fontFamily: 'monospace',
                        backgroundColor: 'background.paper',
                      }
                    }}
                  />
                </Box>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                🗳️ This is where voters go to cast their ballots.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* HIGHLIGHTED RESULTS LINK SECTION */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PollIcon sx={{ mr: 1, color: 'primary.main' }} />
            Results Link
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            View live results and detailed analytics for your poll. Share this link with anyone you want to see the results.
          </Alert>
          <Card variant="outlined" sx={{ backgroundColor: 'rgba(25, 118, 210, 0.08)', borderColor: 'primary.main' }}>
            <CardContent>
              <TextField
                fullWidth
                value={resultsUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copiedField === 'results' ? 'Copied!' : 'Copy results link'}>
                        <IconButton
                          onClick={() => copyToClipboard(resultsUrl, 'results')}
                          edge="end"
                          color={copiedField === 'results' ? 'success' : 'default'}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  sx: {
                    fontFamily: 'monospace',
                    backgroundColor: 'background.paper',
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                📊 View ranked-choice voting results and winner analysis.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {myPollsUrl && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                Your Polls Dashboard
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                You can view and manage all your polls in one place using your personal dashboard.
              </Alert>
              <Button
                variant="contained"
                startIcon={<DashboardIcon />}
                endIcon={<LaunchIcon />}
                onClick={() => window.open(myPollsUrl, '_blank')}
                size="large"
                fullWidth
                sx={{
                  py: 1.5,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                Go to My Polls Dashboard
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Bookmark this link to access all your polls anytime
              </Typography>
            </Box>
            <Divider sx={{ my: 3 }} />
          </>
        )}
      </Paper>
    </Container>
    </Box>
  );
};

export default PollCreatedSuccess;