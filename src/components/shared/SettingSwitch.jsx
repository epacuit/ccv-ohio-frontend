import React from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

/**
 * SettingSwitch Component
 * 
 * Enhanced switch with visual feedback - colored background and icons
 * Used for poll settings in both CreatePoll and Admin
 */
const SettingSwitch = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: checked ? 'rgba(76, 175, 80, 0.08)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: 1,
        px: 2,
        py: 0.5,
        mx: -2,
        transition: 'all 0.2s ease',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={onChange}
            disabled={disabled}
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1} flex={1}>
            <Box flex={1}>
              <Typography
                variant="body2"
                color={checked ? 'primary' : 'text.primary'}
                sx={{ transition: 'color 0.2s ease' }}
              >
                {label}
              </Typography>
              {description && (
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
            {checked ? (
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
            ) : (
              <CancelIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
            )}
          </Box>
        }
      />
    </Box>
  );
};

export default SettingSwitch;