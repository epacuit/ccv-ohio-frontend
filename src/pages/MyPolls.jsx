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
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {polls.length} poll{polls.length === 1 ? '' : 's'}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {polls.map((poll) => (
                <Grid item xs={12} md={6} lg={4} key={poll.id}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        boxShadow: 2,
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h2" sx={{ flexGrow: 1, pr: 1 }}>
                          {poll.title}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(poll.status)}
                          label={poll.status}
                          size="small"
                          color={getStatusColor(poll.status)}
                          variant="outlined"
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Poll ID:
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace">
                            {poll.short_id}
                          </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Total Votes:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {poll.total_ballots || 0}
                          </Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Created:
                          </Typography>
                          <Typography variant="body2">
                            {new Date(poll.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Stack direction="column" spacing={1} width="100%">
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AdminIcon />}
                          onClick={() => navigate(`/admin/${poll.short_id}?token=${poll.admin_token}`)}
                          size="small"
                        >
                          Admin Panel
                        </Button>
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<VoteIcon />}
                            onClick={() => navigate(`/vote/${poll.short_id}`)}
                            size="small"
                          >
                            Vote
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ResultsIcon />}
                            onClick={() => navigate(`/results/${poll.short_id}`)}
                            size="small"
                          >
                            Results
                          </Button>
                        </Stack>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default MyPolls;