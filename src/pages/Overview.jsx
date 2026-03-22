import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import ElectionFlowDemo from '../components/ElectionFlowDemo';

const Overview = () => {
  const location = useLocation();
  const isEmbedded = new URLSearchParams(location.search).get('embedded') === 'true';

  return (
    <Box sx={{ pt: isEmbedded ? '20px' : '180px', pb: 4 }}>
      <Container maxWidth="md">
        <ElectionFlowDemo />
      </Container>
    </Box>
  );
};

export default Overview;
