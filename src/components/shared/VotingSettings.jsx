import React from 'react';
import {
  Box,
  Typography,
  Alert,
} from '@mui/material';
import SettingSwitch from './SettingSwitch';

/**
 * VotingSettings Component
 * 
 * When votes exist:
 * - Allow ties: DISABLED (can't change)
 * - Require complete ranking: DISABLED (can't change)  
 * - Randomize options: EDITABLE (can change)
 * - Allow write-ins: EDITABLE (can change)
 */
const VotingSettings = ({
  settings = {},
  onSettingChange,
  isPrivatePoll = false,
  disabled = false,
  canModifyOptions = true,  // FALSE when votes exist
}) => {
  const handleSettingChange = (setting, value) => {
    if (onSettingChange) {
      onSettingChange(setting, value);
    }
  };

  // Only disable settings that affect ballot structure
  const structuralSettingsLocked = disabled || !canModifyOptions;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Voting Settings
      </Typography>

      {!canModifyOptions && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tie and ranking requirements cannot be changed after voting starts
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SettingSwitch
          checked={settings.allow_ties !== false}
          onChange={(e) => handleSettingChange('allow_ties', e.target.checked)}
          label="Allow voters to rank options equally (ties)"
          disabled={structuralSettingsLocked}  // DISABLED when votes exist
        />

        <SettingSwitch
          checked={settings.require_complete_ranking === true}
          onChange={(e) => handleSettingChange('require_complete_ranking', e.target.checked)}
          label="Require voters to rank all options"
          disabled={structuralSettingsLocked}  // DISABLED when votes exist
        />

        <SettingSwitch
          checked={settings.randomize_options === true}
          onChange={(e) => handleSettingChange('randomize_options', e.target.checked)}
          label="Randomize option order for each voter"
          disabled={disabled}  // Only disabled in non-edit mode, CAN CHANGE with votes
        />

        {!isPrivatePoll && (
          <SettingSwitch
            checked={settings.allow_write_in === true}
            onChange={(e) => handleSettingChange('allow_write_in', e.target.checked)}
            label="Allow write-in candidates"
            disabled={disabled}  // Only disabled in non-edit mode, CAN CHANGE with votes
          />
        )}
      </Box>
    </Box>
  );
};

export default VotingSettings;