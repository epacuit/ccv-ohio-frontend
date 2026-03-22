import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import {
  SearchOff as NotFoundIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { usePageTitle } from '../hooks/usePageTitle';

const NotFound = () => {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: '134.195px', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
          <NotFoundIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
