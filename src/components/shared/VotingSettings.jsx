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
 * Settings for pairwise comparison voting.
 * When votes exist:
 * - Require all matchups: DISABLED (can't change)
 * - Randomize options: EDITABLE (can change)
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
          Matchup requirements cannot be changed after voting starts
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SettingSwitch
          checked={settings.require_all_matchups === true}
          onChange={(e) => handleSettingChange('require_all_matchups', e.target.checked)}
          label="Require voters to complete every head-to-head matchup"
          disabled={structuralSettingsLocked}
        />

        <SettingSwitch
          checked={settings.randomize_options === true}
          onChange={(e) => handleSettingChange('randomize_options', e.target.checked)}
          label="Randomize option order for each voter"
          disabled={disabled}
        />

        <SettingSwitch
          checked={settings.allow_vote_updates !== false}
          onChange={(e) => handleSettingChange('allow_vote_updates', e.target.checked)}
          label="Allow voters to update their vote after submitting"
          disabled={disabled}
        />
      </Box>
    </Box>
  );
};

export default VotingSettings;
