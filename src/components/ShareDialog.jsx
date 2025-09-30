import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  ContentCopy as CopyIcon,
  WhatsApp as WhatsAppIcon,
  Reddit as RedditIcon,
} from '@mui/icons-material';

const ShareDialog = ({ open, onClose, poll, shareUrl }) => {
  const [copied, setCopied] = React.useState(false);
  
  // Generate share text
  const shareTitle = poll?.title || 'Check out this poll';
  const shareText = `${shareTitle} - Check out this poll from BetterChoices!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);
  
  // Social media share URLs
  const shareLinks = {
    email: {
      url: `mailto:?subject=${encodedText}&body=${encodedText}%20${encodedUrl}`,
      label: 'Email',
      icon: <EmailIcon />,
      color: '#EA4335'
    },
    facebook: {
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Facebook',
      icon: <FacebookIcon />,
      color: '#1877F2'
    },
    twitter: {
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      label: 'X (Twitter)',
      icon: <TwitterIcon />,
      color: '#000000'
    },
    linkedin: {
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'LinkedIn',
      icon: <LinkedInIcon />,
      color: '#0A66C2'
    },
    whatsapp: {
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      color: '#25D366'
    },
    reddit: {
      url: `https://www.reddit.com/submit?title=${encodedText}&url=${encodedUrl}`,
      label: 'Reddit',
      icon: <RedditIcon />,
      color: '#FF4500'
    }
  };
  
  const handleShare = (platform) => {
    window.open(shareLinks[platform].url, '_blank', 'width=600,height=400');
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };
  
  const handleCloseCopied = () => {
    setCopied(false);
  };
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Share Poll</Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Share this poll
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {poll?.title}
            </Typography>
          </Box>
          
          {/* Social Media Icons Grid */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Share via
            </Typography>
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
                mt: 2
              }}
            >
              {Object.entries(shareLinks).map(([platform, config]) => (
                <Tooltip key={platform} title={config.label}>
                  <Box
                    onClick={() => handleShare(platform)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: config.color,
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: 1,
                      }
                    }}
                  >
                    <Box sx={{ color: config.color, mb: 0.5 }}>
                      {config.icon}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {config.label}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
          
          {/* Copy Link Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Or copy link
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={shareUrl}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                  }
                }}
              />
              <Tooltip title="Copy link">
                <IconButton
                  onClick={handleCopyLink}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Copy Confirmation Snackbar */}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={handleCloseCopied}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseCopied}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;