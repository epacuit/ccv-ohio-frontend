import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Collapse,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Info as InfoIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

const PollDetails = ({ 
  poll, 
  defaultExpanded = false,
  showToggleButton = true,
  elevation = 0,
  sx = {} 
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!poll) return null;

  const hasDetails = poll.description || (poll.options && poll.options.length > 0);
  if (!hasDetails) return null;

  // Check if ANY candidate has an image
  const hasAnyImage = poll.options?.some(option => option.image_url);

  const content = (
    <Paper
      elevation={elevation}
      sx={{
        p: 3,
        backgroundColor: alpha(theme.palette.grey[50], 0.5),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        ...sx,
      }}
    >
      {poll.description && (
        <Box mb={3}>
          <ReactMarkdown>{poll.description}</ReactMarkdown>
        </Box>
      )}
      
      {poll.options && poll.options.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: poll.description ? 2 : 0, mb: 2 }}>
            Candidates
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {poll.options.map((option) => (
              <Box key={option.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {hasAnyImage && (
                  <Avatar 
                    src={option.image_url} 
                    alt={option.name}
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      flexShrink: 0,
                      backgroundColor: !option.image_url ? theme.palette.grey[300] : undefined 
                    }}
                  >
                    {!option.image_url && <PersonIcon />}
                  </Avatar>
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: hasAnyImage ? 'bold' : 'normal',
                      color: theme.palette.text.primary,
                    }}
                  >
                    {option.name}
                  </Typography>
                  {option.description && (
                    <Box sx={{ 
                      mt: 0.5, 
                      color: theme.palette.text.secondary,
                      '& p': { margin: 0 },
                      '& p:not(:last-child)': { mb: 1 },
                      '& ul, & ol': { mt: 0.5, mb: 0.5, pl: 2 },
                      '& li': { mb: 0.25 },
                      '& strong': { 
                        color: theme.palette.text.secondary,
                        fontWeight: 600 
                      },
                    }}>
                      <ReactMarkdown>{option.description}</ReactMarkdown>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );

  if (!showToggleButton) {
    return content;
  }

  return (
    <>
      <Button
        size="small"
        startIcon={<InfoIcon />}
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          mb: 2,
          textTransform: 'none',
          color: expanded ? 'primary.main' : 'text.secondary',
        }}
      >
        {expanded ? 'Hide Information' : 'Information'}
      </Button>
      
      <Collapse in={expanded}>
        {content}
      </Collapse>
    </>
  );
};

export default PollDetails;