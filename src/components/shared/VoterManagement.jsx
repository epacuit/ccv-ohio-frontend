// app/components/shared/VoterManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Email as EmailIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Forward as ResendIcon,
} from '@mui/icons-material';
import EmailListInput from './EmailListInput';
import API from '../../services/api';

const VoterManagement = ({ pollId, adminToken }) => {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ total: 0, invited: 0 });
  
  // Add voters state
  const [showAddVoters, setShowAddVoters] = useState(false);
  const [newEmails, setNewEmails] = useState([]);
  const [addingVoters, setAddingVoters] = useState(false);
  
  // Sending invites state
  const [sendingInvites, setSendingInvites] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Regenerate token confirmation
  const [regenerateTarget, setRegenerateTarget] = useState(null);

  // Fetch voters
  const fetchVoters = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await API.get(`/polls/${pollId}/voters`, {
        params: { admin_token: adminToken }
      });
      
      setVoters(response.data.voters || []);
      setStats({
        total: response.data.total || 0,
        invited: response.data.invited || 0
      });
    } catch (err) {
      setError('Failed to load voters');
      console.error('Error fetching voters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, [pollId, adminToken]);

  // Add new voters
  const handleAddVoters = async () => {
    if (newEmails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }

    setAddingVoters(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await API.post(`/polls/${pollId}/voters`, {
        admin_token: adminToken,
        emails: newEmails,
        send_invitations: false
      });
      
      const added = response.data.added?.length || 0;
      const duplicates = response.data.duplicates?.length || 0;
      
      setSuccess(`Added ${added} voter(s)${duplicates > 0 ? ` (${duplicates} duplicates skipped)` : ''}`);
      setNewEmails([]);
      setShowAddVoters(false);
      fetchVoters();
    } catch (err) {
      setError('Failed to add voters');
      console.error('Error adding voters:', err);
    } finally {
      setAddingVoters(false);
    }
  };

  // Send or resend invitation
  const handleSendInvitation = async (email = null) => {
    setSendingInvites(true);
    setSendingTo(email);
    setError('');
    setSuccess('');
    
    try {
      const response = await API.post(`/polls/${pollId}/send-invitations`, {
        admin_token: adminToken,
        emails: email ? [email] : []
      });
      
      const sent = response.data.sent_to?.length || 0;
      const failed = response.data.failed?.length || 0;
      
      if (email) {
        if (sent > 0) {
          setSuccess(`Invitation sent to ${email}`);
        } else if (failed > 0) {
          setError(`Failed to send invitation to ${email}`);
        }
      } else {
        setSuccess(
          `Sent ${sent} invitation(s)${failed > 0 ? ` (${failed} failed)` : ''}. ` +
          (response.data.note || '')
        );
      }
      
      if (sent > 0) {
        fetchVoters();
      }
    } catch (err) {
      setError(email ? `Failed to send invitation to ${email}` : 'Failed to send invitations');
      console.error('Error sending invitations:', err);
    } finally {
      setSendingInvites(false);
      setSendingTo(null);
    }
  };

  // Delete voter
  const handleDeleteVoter = async (email) => {
    setDeleteTarget(null);
    setError('');
    setSuccess('');
    
    try {
      const response = await API.delete(`/polls/${pollId}/voters/${encodeURIComponent(email)}`, {
        params: { admin_token: adminToken }
      });
      
      let message = `Removed voter: ${email}`;
      if (response.data.ballot_deleted) {
        message += ' (their vote was also removed)';
      }
      
      setSuccess(message);
      fetchVoters();
    } catch (err) {
      setError(`Failed to remove voter: ${email}`);
      console.error('Error deleting voter:', err);
    }
  };

  // Regenerate token and send new invitation
  const handleRegenerateToken = async (email) => {
    setRegenerateTarget(null);
    setError('');
    setSuccess('');
    
    try {
      const regenResponse = await API.post(`/polls/${pollId}/voters/${encodeURIComponent(email)}/regenerate-token`, {
        admin_token: adminToken
      });
      
      const inviteResponse = await API.post(`/polls/${pollId}/send-invitations`, {
        admin_token: adminToken,
        emails: [email]
      });
      
      let message = `New token generated and invitation sent to ${email}`;
      if (regenResponse.data.ballot_deleted) {
        message += ' (previous vote was removed)';
      }
      
      setSuccess(message);
      fetchVoters();
    } catch (err) {
      setError(`Failed to regenerate token for ${email}`);
      console.error('Error regenerating token:', err);
    }
  };

  // Count pending invitations
  const pendingInvites = voters.filter(v => !v.invitation_sent).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Voter Management ({stats.total} voter{stats.total !== 1 ? 's' : ''})
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={() => setShowAddVoters(!showAddVoters)}
          >
            Add Voters
          </Button>
          {pendingInvites > 0 && (
            <Button
              variant="contained"
              startIcon={sendingInvites && !sendingTo ? <CircularProgress size={16} /> : <SendIcon />}
              onClick={() => handleSendInvitation()}
              disabled={sendingInvites}
            >
              Send {pendingInvites} Pending Invitation{pendingInvites !== 1 ? 's' : ''}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Stats Cards - Clean design with borders, no elevation */}
      <Stack direction="row" spacing={2} mb={3}>
        <Box 
          sx={{ 
            p: 2.5, 
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PersonAddIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Voters</Typography>
            </Box>
          </Stack>
        </Box>
        <Box 
          sx={{ 
            p: 2.5, 
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <EmailIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>{stats.invited}</Typography>
              <Typography variant="body2" color="text.secondary">Invitations Sent</Typography>
            </Box>
          </Stack>
        </Box>
        <Box 
          sx={{ 
            p: 2.5, 
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>{pendingInvites}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Invitations</Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

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

      {/* Add Voters Section - Clean border design */}
      {showAddVoters && (
        <Box 
          sx={{ 
            p: 3, 
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Voters
          </Typography>
          <EmailListInput
            emails={newEmails}
            onChange={setNewEmails}
            label="New Voter Email Addresses"
            helperText="Enter email addresses to add as voters"
          />
          <Stack direction="row" spacing={2} mt={2}>
            <Button
              variant="contained"
              onClick={handleAddVoters}
              disabled={addingVoters || newEmails.length === 0}
              startIcon={addingVoters ? <CircularProgress size={16} /> : <PersonAddIcon />}
            >
              {addingVoters ? 'Adding...' : `Add ${newEmails.length} Voter${newEmails.length !== 1 ? 's' : ''}`}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setShowAddVoters(false);
                setNewEmails([]);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {/* Voters Table - Clean design */}
      <Box 
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: 'background.paper'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Invitation Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary" py={3}>
                    No voters added yet
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              voters.map((voter, index) => (
                <TableRow 
                  key={voter.email}
                  sx={{ 
                    '&:last-child td': { border: 0 },
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'grey.50'
                  }}
                >
                  <TableCell>{voter.email}</TableCell>
                  <TableCell align="center">
                    {voter.invitation_sent ? (
                      <Chip 
                        label="Invitation Sent" 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'success.light',
                          color: 'success.dark',
                          fontWeight: 500
                        }}
                      />
                    ) : (
                      <Chip 
                        label="Not Invited" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: 'grey.400',
                          color: 'text.secondary'
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {!voter.invitation_sent ? (
                        <Tooltip title="Send invitation">
                          <IconButton
                            size="small"
                            onClick={() => handleSendInvitation(voter.email)}
                            disabled={sendingInvites && sendingTo === voter.email}
                            sx={{ color: 'primary.main' }}
                          >
                            {sendingInvites && sendingTo === voter.email ? (
                              <CircularProgress size={16} />
                            ) : (
                              <SendIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Resend invitation">
                          <IconButton
                            size="small"
                            onClick={() => handleSendInvitation(voter.email)}
                            disabled={sendingInvites && sendingTo === voter.email}
                            sx={{ color: 'primary.main' }}
                          >
                            {sendingInvites && sendingTo === voter.email ? (
                              <CircularProgress size={16} />
                            ) : (
                              <ResendIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Generate new token & send invitation">
                        <IconButton
                          size="small"
                          onClick={() => setRegenerateTarget(voter.email)}
                          sx={{ color: 'warning.main' }}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove voter">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(voter.email)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Privacy Notice */}
      <Alert 
        severity="info" 
        sx={{ 
          mt: 3,
          border: '1px solid',
          borderColor: 'info.light',
          backgroundColor: 'info.lighter'
        }}
      >
        <Typography variant="body2">
          <strong>Privacy Notice:</strong> To maintain voting anonymity, this panel does not show who has voted or the voter tokens.

        </Typography>
      </Alert>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove Voter?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>{deleteTarget}</strong> from the voter list?
            <Box mt={2}>
              <Alert severity="info">
                If this voter has already voted, their vote will be removed.
              </Alert>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={() => handleDeleteVoter(deleteTarget)} color="error" variant="contained">
            Remove Voter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Token Confirmation Dialog */}
      <Dialog open={!!regenerateTarget} onClose={() => setRegenerateTarget(null)}>
        <DialogTitle>Generate New Token?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Generating a new token for <strong>{regenerateTarget}</strong> will:
            <ul>
              <li>Create a new unique voting link</li>
              <li>Invalidate their previous voting link</li>
              <li>Send them a new invitation email</li>
              <li><strong>Remove any existing vote they may have submitted</strong></li>
            </ul>
            
            <Alert severity="warning" sx={{ mt: 2 }}>
              Use this if a voter lost their invitation or if you need to reset their voting status.
            </Alert>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegenerateTarget(null)}>Cancel</Button>
          <Button 
            onClick={() => handleRegenerateToken(regenerateTarget)} 
            color="warning" 
            variant="contained"
            startIcon={<RefreshIcon />}
          >
            Generate New Token & Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VoterManagement;