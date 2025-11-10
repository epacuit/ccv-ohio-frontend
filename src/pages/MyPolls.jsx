import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  Poll as PollIcon,
  CheckCircle as OpenIcon,
  Cancel as ClosedIcon,
  HowToVote as VoteIcon,
  Assessment as ResultsIcon,
} from '@mui/icons-material';
import API from '../services/api';

const MyPolls = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPolls = async () => {
      if (!email) {
        setError('No email provided');
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/polls/by-owner', {
          params: { email: decodeURIComponent(email) }
        });
        setPolls(response.data);
      } catch (err) {
        console.error('Error fetching polls:', err);
        setError('Failed to load polls. Please check your email and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [email]);

  const getStatusColor = (status) => {
    return status === 'open' ? 'success' : 'default';
  };

  const getStatusIcon = (status) => {
    return status === 'open' ? <OpenIcon /> : <ClosedIcon />;
  };

  if (loading) {
    return (
      <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }} color="text.secondary">
            Loading your polls...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                My Polls Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create')}
            size="large"
          >
            Create New Poll
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!error && polls.length === 0 && (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <PollIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No polls yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You haven't created any polls with this email address yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create')}
              size="large"
            >
              Create Your First Poll
            </Button>
          </Paper>
        )}

        {polls.length > 0 && (
          <>
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {polls.length} poll{polls.length === 1 ? '' : 's'}
              </Typography>
            </Box>

            <Stack spacing={2}>
              {polls.map((poll) => (
                <Card 
                  key={poll.id}
                  elevation={0}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.main',
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={3}>
                      
                      {/* Column 1: Poll Info - Flexible width */}
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                            {poll.title}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(poll.status)}
                            label={poll.status}
                            size="small"
                            color={getStatusColor(poll.status)}
                            sx={{ 
                              textTransform: 'capitalize',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                        
                        <Stack direction="row" spacing={3} mt={1.5}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Poll ID
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                              {poll.short_id}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Created
                            </Typography>
                            <Typography variant="body2">
                              {new Date(poll.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Typography>
                          </Box>
                          
                          {poll.slug && (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Custom URL
                              </Typography>
                              <Typography variant="body2" fontFamily="monospace" color="primary.main">
                                /{poll.slug}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>

                      {/* Column 2: Vote Count - Fixed width */}
                      <Box sx={{ width: 100, textAlign: 'center', flexShrink: 0 }}>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {poll.total_ballots || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {poll.total_ballots === 1 ? 'Vote' : 'Votes'}
                        </Typography>
                      </Box>

                      {/* Column 3: Buttons - Fixed width, FLUSH RIGHT */}
                      <Box sx={{ width: 200, flexShrink: 0 }}>
                        <Stack direction="column" spacing={1}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AdminIcon />}
                            onClick={() => navigate(`/admin/${poll.short_id}?token=${poll.admin_token}`)}
                            sx={{
                              backgroundColor: 'grey.300',
                              color: 'grey.900',
                              '&:hover': {
                                backgroundColor: 'grey.400'
                              }
                            }}
                          >
                            Admin Panel
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<VoteIcon />}
                            onClick={() => navigate(`/vote/${poll.short_id}`)}
                          >
                            Vote
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ResultsIcon />}
                            onClick={() => navigate(`/results/${poll.short_id}`)}
                          >
                            Results
                          </Button>
                        </Stack>
                      </Box>

                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  );
};

export default MyPolls;