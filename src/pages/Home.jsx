import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Link,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Poll as PollIcon,
  ArrowForward as ArrowIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Diversity3 as CommunityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import betterChoicesIcon from '../assets/BC4D-wht.png';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActiveRoute = (path) => location.pathname === path;
  const handleMobileMenuToggle = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleNavigate = (path) => { navigate(path); setMobileMenuOpen(false); };
  
  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Create', path: '/create' },
  ];
  
  const menuButtonStyles = (path) => ({
    textTransform: 'none',
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: '24px',
    color: 'white',
    position: 'relative',
    pb: 1,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '3px',
      backgroundColor: 'white',
      transform: isActiveRoute(path) ? 'scaleX(1)' : 'scaleX(0)',
      transition: 'transform 0.3s ease',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
    },
  });
  
  const demoPolls = [
    {
      title: "Alaska 2022 Special General Election",
      description: "Experience Consensus Choice Voting with real election data",
      link: "/results/alaska2022",
    },
    {
      title: "Favorite Ice Cream",
      description: "Join our ongoing poll to rank your favorite ice cream flavors",
      pollId: "ice-cream-poll",
      isLive: true,
    },
  ];

  return (
    <>
      {/* Navigation */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: 'transparent',
          boxShadow: 'none',
          zIndex: theme.zIndex.appBar + 1,
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: isMobile ? '80px !important' : '134.195px !important',
            height: isMobile ? '80px' : '134.195px',
            px: 0,
            position: 'relative',
            width: '100%',
          }}
        >
          {!isMobile && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: '100%',
                pr: '49.12px',
              }}
            >
              <Box sx={{ display: 'flex', gap: 3 }}>
                {menuItems.map((item) => (
                  <Button 
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={menuButtonStyles(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          {isMobile && (
            <Box
              sx={{
                position: 'absolute',
                right: '20px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <IconButton
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuToggle}
                sx={{ fontSize: '30px', color: 'white' }}
              >
                <MenuIcon sx={{ fontSize: 'inherit' }} />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: '280px',
            backgroundColor: 'rgb(20, 32, 57)',
            color: 'white',
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Menu
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleMobileMenuToggle}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List sx={{ pt: 2 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: isActiveRoute(item.path)
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{
                      fontSize: '18px',
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                      color: 'white',
                    }}
                  />
                </ListItemButton>
              </ListItem>
              {index < menuItems.length - 1 && (
                <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Drawer>

      {/* Hero Section */}
      <Box 
        sx={{
          textAlign: 'center',
          py: { xs: 10, md: 14 },
          minHeight: { xs: '400px', md: '450px' },
          display: 'flex',
          alignItems: 'center',
          background: 'radial-gradient(ellipse 130% 130% at 0% 0%, #8a9abb 0%, #3a4a6c 30%, #142039 70%)',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              mb: 2,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Consensus Choice Voting
          </Typography>
          
          {/* Better Choices Link */}
          <Box sx={{ mb: 2 }}>
            <Link
              href="https://betterchoices.vote"
              target="_blank"
              rel="noopener"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 500,
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Learn more at BetterChoices.vote
              <ArrowIcon sx={{ ml: 1 }} />
            </Link>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        
        {/* Use Cases Section */}
<Box sx={{ mb: 8 }}>
  <Typography variant="h4" align="center" sx={{ mb: 1 }}>
    Perfect for Any Group Decision
  </Typography>
  
  {/* Tagline with rankings emphasis */}
  <Typography 
    variant="h6" 
    align="center" 
    color="text.secondary"
    sx={{ mb: 4, fontWeight: 400 }}
  >
 Consensus Choice uses every voter's entire ranking - not just their top choice - to find the candidate with the widest appeal.
  </Typography>
  
  <List sx={{ maxWidth: '800px', mx: 'auto' }}>
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon>
                <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Schools & Universities"
                secondary="Student elections, class representatives, academic awards, club officers"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
            
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon>
                <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Organizations"
                secondary="Board elections, project prioritization, team decisions, strategic planning"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
            
            <ListItem sx={{ py: 2 }}>
              <ListItemIcon>
                <CommunityIcon color="primary" sx={{ fontSize: 32 }} />
              </ListItemIcon>
              <ListItemText 
                primary="Communities"
                secondary="HOA decisions, community projects, event planning, group activities"
                primaryTypographyProps={{ fontSize: '1.25rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '1.125rem' }}
              />
            </ListItem>
  </List>
  
  <Box sx={{ mt: 5, textAlign: 'center' }}>
    <Button
      variant="contained"
      size="large"
      onClick={() => navigate('/create')}
      sx={{ 
        px: 8,
        py: 2,
        fontSize: '1.25rem',
        fontWeight: 600,
        minWidth: '320px',
        textTransform: 'none',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)',
        },
        transition: 'all 0.2s ease',
      }}
    >
      Create Your First Poll
    </Button>
  </Box>
</Box>

        {/* Example Polls Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" align="center" sx={{ mb: 4 }}>
            Try an Example
          </Typography>
          
          <Grid container spacing={3} justifyContent="center">
            {demoPolls.map((poll, index) => (
              <Grid item xs={12} sm={6} md={5} key={index}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    p: 3,
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <PollIcon sx={{ color: 'primary.main' }} />
                      {poll.isLive && (
                        <Chip
                          label="LIVE"
                          size="small"
                          sx={{
                            backgroundColor: 'error.light',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    
                    <Typography variant="h6" component="h3" gutterBottom>
                      {poll.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 3, flexGrow: 1 }}
                    >
                      {poll.description}
                    </Typography>
                    
                    <Box mt="auto">
                      {poll.isLive ? (
                        <Box display="flex" gap={1.5}>
                          <Button 
                            variant="contained"
                            fullWidth
                            onClick={() => navigate(`/vote/${poll.pollId}`)}
                            size="small"
                          >
                            Vote Now
                          </Button>
                          <Button 
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate(`/results/${poll.pollId}`)}
                            size="small"
                          >
                            View Results
                          </Button>
                        </Box>
                      ) : (
                        <Button 
                          variant="outlined"
                          fullWidth
                          onClick={() => navigate(poll.link)}
                          endIcon={<ArrowIcon />}
                        >
                          View Results
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>


    </>
  );
};

export default HomePage;
