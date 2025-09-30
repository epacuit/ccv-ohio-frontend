import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #2a3a5c 0%, #0a1229 100%)',
        color: 'white',
        py: 4,
        mt: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="body1" 
          align="center"
          sx={{ 
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          For more information about Consensus Choice Voting, visit{' '}
          <Link 
            href="https://betterchoices.vote" 
            target="_blank" 
            rel="noopener"
            sx={{
              color: '#8a9abb',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: '#a5b5d5',
                textDecoration: 'underline',
              },
            }}
          >
            betterchoices.vote
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;