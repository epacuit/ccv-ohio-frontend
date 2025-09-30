import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import betterChoicesIcon from '../assets/BC4D-wht.png';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isHomePage = location.pathname === '/';
  const [showNavbar, setShowNavbar] = useState(!isHomePage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (isHomePage) {
      const handleScroll = () => {
        setShowNavbar(window.scrollY > 400);
      };
      
      window.addEventListener('scroll', handleScroll);
      handleScroll();
      
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setShowNavbar(true);
    }
  }, [isHomePage]);

  // Helper function to check if a route is active
  const isActiveRoute = (path) => location.pathname === path;

  const handleMobileMenuToggle = () => setMobileMenuOpen(!mobileMenuOpen);
  const handleNavigate = (path) => { navigate(path); setMobileMenuOpen(false); };

  // Menu items configuration
  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Create', path: '/create' },
  ];

  // Desktop menu button styles
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

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #3a4a6c 0%, #142039 100%)',
          transition: isHomePage ? 'opacity 0.5s ease-in-out' : 'none',
          opacity: showNavbar ? 1 : 0,
          pointerEvents: showNavbar ? 'auto' : 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
          {/* Logo - Responsive sizing */}
          <Box 
            sx={{ 
              position: 'absolute',
              left: isMobile ? '20px' : '49.12px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <img 
              src={betterChoicesIcon} 
              alt="Better Choices" 
              style={{ 
                width: isMobile ? '140px' : '227.65px',
                height: isMobile ? '55px' : '89.99px',
              }}
            />
          </Box>

          {/* Desktop Menu */}
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

          {/* Mobile Menu Button */}
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
                sx={{ fontSize: '30px' }}
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
            background: 'linear-gradient(135deg, #3a4a6c 0%, #142039 100%)',
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
    </>
  );
};

export default NavigationBar;