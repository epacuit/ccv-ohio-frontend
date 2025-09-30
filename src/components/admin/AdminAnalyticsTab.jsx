import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  Schedule as ScheduleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * AdminAnalyticsTab Component
 * 
 * Displays voting analytics and metrics
 */
const AdminAnalyticsTab = ({
  analytics,
  poll,
  onRefresh,
}) => {
  const MetricCard = ({ title, value, subtitle, icon, gradient, shadow }) => (
    <Card sx={{ 
      height: '100%', 
      background: gradient,
      boxShadow: shadow,
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="white" variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            <Typography variant="h3" color="white" sx={{ fontWeight: 'bold', mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon}
        </Box>
      </CardContent>
    </Card>
  );

  if (!analytics) {
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Voting Analytics</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Votes"
            value={analytics.totalVotes}
            subtitle={analytics.testVotes > 0 ? `+${analytics.testVotes} test votes` : null}
            icon={<VoteIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />}
            gradient="linear-gradient(135deg, #1976d2 0%, #1565c0 100%)"
            shadow="0 4px 20px rgba(25, 118, 210, 0.2)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Poll Duration"
            value={`${poll?.created_at ? dayjs().diff(dayjs(poll.created_at), 'day') : 0}d`}
            subtitle={poll?.created_at ? `Since ${dayjs(poll.created_at).format('MMM D')}` : 'Unknown'}
            icon={<ScheduleIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />}
            gradient="linear-gradient(135deg, #616161 0%, #424242 100%)"
            shadow="0 4px 20px rgba(0, 0, 0, 0.1)"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Status"
            value={poll?.is_active ? 'Active' : 'Closed'}
            subtitle={poll?.time_remaining || null}
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />}
            gradient={poll?.is_active 
              ? 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)'
              : 'linear-gradient(135deg, #e53935 0%, #d32f2f 100%)'}
            shadow={poll?.is_active 
              ? '0 4px 20px rgba(67, 160, 71, 0.2)'
              : '0 4px 20px rgba(229, 57, 53, 0.2)'}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            backgroundColor: '#f5f5f5',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Access Type
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1, color: poll?.is_private ? '#1976d2' : '#43a047' }}>
                    {poll?.is_private ? 'Private' : 'Public'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {poll?.is_private ? `${poll.voters?.length || 0} invited` : 'Open to all'}
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 48, color: poll?.is_private ? '#1976d2' : '#43a047', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {dayjs(analytics.lastUpdated).format('MMMM D, YYYY h:mm A')}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Activity monitoring and detailed analytics will be available in a future update.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vote Distribution
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Detailed vote distribution and patterns analysis coming soon.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminAnalyticsTab;