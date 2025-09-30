import React from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';

/**
 * PollBasicInfo Component
 * 
 * Shared component for editing basic poll information
 * Used in both CreatePoll and Admin components
 */
const PollBasicInfo = ({
  poll,
  onChange,
  disabled = false,
  showCompletedToggle = false,
  errors = {},
  refs = {},
}) => {
  const handleChange = (field, value) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      
        <TextField
        fullWidth
        label="Poll Title"
        value={poll?.title || ''}
        onChange={(e) => handleChange('title', e.target.value)}
        disabled={disabled}
        required
        margin="normal"
        variant="outlined"
        placeholder="What should we decide?"
        error={errors.title}
        helperText={errors.title ? 'Title is required' : ''}  // ADD THIS
        inputRef={(el) => {
            if (refs.current) refs.current.title = el;
        }}
        sx={{
            '& .MuiOutlinedInput-root': {
            '&.Mui-error': {
                '& fieldset': {
                borderColor: 'error.main',
                borderWidth: 2,
                },
            },
            },
        }}
        />
      
      <TextField
        fullWidth
        label="Description"
        value={poll?.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        disabled={disabled}
        margin="normal"
        variant="outlined"
        multiline
        rows={3}
        placeholder="Provide more information about this poll..."
      />
      
      {showCompletedToggle && (
        <FormControlLabel
          control={
            <Switch
              checked={poll?.is_completed || false}
              onChange={(e) => handleChange('is_completed', e.target.checked)}
              disabled={disabled}
            />
          }
          label="Mark as Completed"
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  );
};

export default PollBasicInfo;

