// Interactive walkthrough page. Fully synthetic — data is generated inside
// SplitScreenCompare based on the current top-k selector.
import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';

import { SplitScreenCompare } from './CompareMethods';

const CompareWalkthrough = () => {
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embedded') === 'true';

  return (
    <Box sx={{ pt: isEmbedded ? '20px' : '180px', pb: 6 }}>
      <Container maxWidth="lg">
        <Button
          component={RouterLink}
          to="/compare-methods"
          startIcon={<BackIcon />}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          Back to comparison
        </Button>

        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            From Ballots to Winners
          </Typography>
        </Box>

        <SplitScreenCompare />
      </Container>
    </Box>
  );
};

export default CompareWalkthrough;
