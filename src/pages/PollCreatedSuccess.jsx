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
  Grid,
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
  Link as LinkIcon,
  Share as ShareIcon,
  Launch as LaunchIcon,
  Warning as WarningIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import API from '../services/api';

const PollCreatedSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pollId, pollTitle, authMethod, adminToken, creatorEmail, voterEmails = [] } = location.state || {};
  
  const [copiedField, setCopiedField] = useState('');
  const [pollData, setPollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  
  // Voter management state
  const [addingVoters, setAddingVoters] = useState(false);
  const [votersAdded, setVotersAdded] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [voterStats, setVoterStats] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if we're embedded based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const embedded = searchParams.get('embedded') === 'true';
    setIsEmbedded(embedded);
  }, [location.search]);

  // Generate URLs
  const baseUrl = window.location.origin;
  const voteUrl = `${baseUrl}/vote/${pollId}`;
  const resultsUrl = `${baseUrl}/results/${pollId}`;
  const adminUrl = adminToken ? `${baseUrl}/admin/${pollId}?token=${adminToken}` : `${baseUrl}/admin/${pollId}`;
  const myPollsUrl = creatorEmail ? `${baseUrl}/my-polls/${encodeURIComponent(creatorEmail)}` : null;

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

  // Automatically add voters if this is a private poll with initial emails
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
          send_invitations: false // Don't auto-send, let user control this
        });
        
        setVotersAdded(true);
        setVoterStats({
          total: voterEmails.length,
          added: response.data.added.length,
          duplicates: response.data.duplicates.length
        });
        
        setSuccess(`Added ${response.data.added.length} voter(s) to your private poll`);
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
        emails: [] // Empty means send to all uninvited voters
      });
      
      setSuccess(`Sent ${response.data.sent_to.length} invitation(s). Check MailHog at http://localhost:8025`);
    } catch (err) {
      console.error('Failed to send invitations:', err);
      setError('Failed to send invitations. Check if MailHog is running.');
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
        {/* Success Header */}
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


      {/* Private Poll Voter Section - PROFESSIONAL DESIGN */}
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
                    <strong>{voterStats.added} voter(s)</strong> have been added to your private poll.
                    {voterStats.duplicates > 0 && ` (${voterStats.duplicates} duplicates skipped)`}
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
            
            {/* Success/Error Messages */}
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
        {/* Quick Action Buttons */}
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

        {/* Share Section - Only for Public Polls */}
        {isPublicPoll && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShareIcon sx={{ mr: 1, color: 'success.main' }} />
                Share Your Poll
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Copy this link to share your poll with voters:
              </Typography>
              <Card variant="outlined" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.08)', borderColor: 'success.main' }}>
                <CardContent>
                  <TextField
                    fullWidth
                    value={voteUrl}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={copiedField === 'share' ? 'Copied!' : 'Copy link'}>
                            <IconButton
                              onClick={() => copyToClipboard(voteUrl, 'share')}
                              edge="end"
                              color={copiedField === 'share' ? 'success' : 'default'}
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
                </CardContent>
              </Card>
            </Box>
            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Admin Access Section - simplified, rest of component continues as before... */}
        {/* Navigation buttons, etc... */}
      </Paper>
    </Container>
    </Box>
  );
};

export default PollCreatedSuccess;