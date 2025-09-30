import React, { useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
} from '@mui/material';
import dayjs from 'dayjs';

// Import shared components
import PollBasicInfo from './PollBasicInfo';
import PollOptionsList from './PollOptionsList';
import VotingSettings from './VotingSettings';
import SettingSwitch from './SettingSwitch';
import PollDateTimePicker from './PollDateTimePicker';

/**
 * PollForm Component
 * 
 * Comprehensive form for creating/editing polls
 * Handles all poll data and provides callbacks for updates
 */
const PollForm = ({
  poll,
  onChange,
  onImageUpload,
  onImageRemove,
  isEditing = false,
  canModifyOptions = true,
  errors = {},
  uploadingImages = {},
  isPrivatePoll = false,
  showCompletedToggle = false,
  refs = { current: {} },
}) => {
  // Add this null check at the very beginning
  if (!poll) {
    return <Box>Loading...</Box>;
  }

  // Ensure closing_datetime is always a dayjs object or null
  const normalizedPoll = {
    ...poll,
    closing_datetime: poll.closing_datetime 
      ? (dayjs.isDayjs(poll.closing_datetime) ? poll.closing_datetime : dayjs(poll.closing_datetime))
      : null
  };

  // Get valid candidate count (non-empty options)
  const validCandidateCount = normalizedPoll.options?.filter(opt => opt.name?.trim()).length || 0;
  
  // CORRECT LOGIC:
  // 1. If user has explicitly set num_ranks, use it (unless it exceeds candidates)
  // 2. Otherwise, default to candidate count
  let dropdownValue;
  const storedValue = normalizedPoll.settings?.num_ranks;
  
  if (typeof storedValue === 'number' && storedValue > 0) {
    // User has set a value - respect it but cap at candidate count
    dropdownValue = Math.min(storedValue, Math.max(validCandidateCount, 1));
  } else {
    // No user value - default to candidate count
    dropdownValue = Math.max(validCandidateCount, 1);
  }

  // Handle changes to basic info
  const handleBasicInfoChange = (field, value) => {
    onChange({ [field]: value });
  };

  // Handle changes to settings
  const handleSettingsChange = (field, value) => {
    // Special handling for require_complete_ranking
    if (field === 'require_complete_ranking' && value === true) {
      // When requiring complete ranking, set num_ranks to candidate count
      onChange({
        settings: {
          ...normalizedPoll.settings,
          [field]: value,
          num_ranks: validCandidateCount > 0 ? validCandidateCount : null
        }
      });
    } else {
      // USER IS EXPLICITLY SETTING num_ranks - store it
      onChange({
        settings: {
          ...normalizedPoll.settings,
          [field]: value
        }
      });
    }
  };

  // Handle option changes
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...normalizedPoll.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    };
    onChange({ options: newOptions });
  };

  // Handle adding option
  const handleAddOption = () => {
    const newOption = {
      id: `temp-${Date.now()}`,
      name: '',
      description: null
    };
    onChange({ options: [...normalizedPoll.options, newOption] });
  };

  // Handle removing option
  const handleRemoveOption = (index) => {
    // Only check total number of option blocks, not their content
    if (normalizedPoll.options.length <= 2) {
        return; // Must keep at least 2 option blocks
    }
    
    onChange({ options: normalizedPoll.options.filter((_, i) => i !== index) });
  };

  // Handle image upload for options
  const handleImageUpload = async (index, file) => {
    if (onImageUpload) {
      await onImageUpload(index, file);
    }
  };

  // Handle image removal for options
  const handleImageRemove = (index) => {
    if (onImageRemove) {
      onImageRemove(index);
    }
  };

  return (
    <Box>
      {/* Basic Information */}
      <Box sx={{ mb: 4 }}>
        <PollBasicInfo
          poll={normalizedPoll}
          onChange={handleBasicInfoChange}
          disabled={!isEditing}
          showCompletedToggle={showCompletedToggle}
          errors={errors}
          refs={refs}
        />
      </Box>

      {/* Voting Settings - only show in column layout for admin */}
      {showCompletedToggle && (
        <Box sx={{ mb: 4 }}>
          <VotingSettings
            settings={normalizedPoll?.settings || {}}
            onSettingChange={handleSettingsChange}
            isPrivatePoll={isPrivatePoll}
            disabled={!isEditing}
            canModifyOptions={canModifyOptions}  // FIXED: Added this prop
          />
          
          {/* Number of Ranks Selector */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Number of Ranks
              {normalizedPoll.settings?.require_complete_ranking && (
                <Chip 
                  label="Locked - Complete ranking required" 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <FormControl fullWidth disabled={!isEditing || normalizedPoll.settings?.require_complete_ranking || !canModifyOptions}>
              {/* FIXED: Added || !canModifyOptions to disabled condition */}
              <Select
                value={normalizedPoll.settings?.require_complete_ranking ? validCandidateCount : dropdownValue}
                onChange={(e) => handleSettingsChange('num_ranks', parseInt(e.target.value))}
                displayEmpty
              >
                {Array.from({ length: Math.max(validCandidateCount, 1) }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? 'rank' : 'ranks'} 
                    {num === validCandidateCount ? ' (all candidates - default)' : ''}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {normalizedPoll.settings?.require_complete_ranking 
                  ? 'Must rank all candidates when complete ranking is required'
                  : `How many candidates can each voter rank? Default is all ${validCandidateCount || 'entered'} candidates.`
                }
              </FormHelperText>
            </FormControl>
          </Box>
        </Box>
      )}

      {/* Poll Options */}
      <Box sx={{ mb: 4 }}>
        <PollOptionsList
          options={normalizedPoll.options || []}
          isEditing={isEditing}
          onOptionChange={handleOptionChange}
          onOptionAdd={handleAddOption}
          onOptionRemove={handleRemoveOption}
          onImageUpload={onImageUpload ? handleImageUpload : undefined}
          onImageRemove={onImageUpload ? handleImageRemove : undefined}
          uploadingImages={uploadingImages || {}}
          fieldErrors={errors}
          errorRefs={refs}   
          canModifyOptions={canModifyOptions}
          showAddButton={canModifyOptions}
          allowImages={!!onImageUpload}
        />
      </Box>

      {/* Voting Settings - show inline for create poll */}
      {!showCompletedToggle && (
        <Box sx={{ mb: 4 }}>
          <VotingSettings
            settings={normalizedPoll?.settings || {}}
            onSettingChange={handleSettingsChange}
            isPrivatePoll={isPrivatePoll}
            disabled={!isEditing}
            canModifyOptions={canModifyOptions}  // FIXED: Added this prop
          />
          
          {/* Number of Ranks Selector */}
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Number of Ranks
              {normalizedPoll.settings?.require_complete_ranking && (
                <Chip 
                  label="Locked - Complete ranking required" 
                  size="small" 
                  color="info" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <FormControl fullWidth disabled={!isEditing || normalizedPoll.settings?.require_complete_ranking || !canModifyOptions}>
              {/* FIXED: Added || !canModifyOptions to disabled condition */}
              <Select
                value={normalizedPoll.settings?.require_complete_ranking ? validCandidateCount : dropdownValue}
                onChange={(e) => handleSettingsChange('num_ranks', parseInt(e.target.value))}
                displayEmpty
              >
                {Array.from({ length: Math.max(validCandidateCount, 1) }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? 'rank' : 'ranks'} 
                    {num === validCandidateCount ? ' (all candidates - default)' : ''}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {normalizedPoll.settings?.require_complete_ranking 
                  ? 'Must rank all candidates when complete ranking is required'
                  : `How many candidates can each voter rank? Default is all ${validCandidateCount || 'entered'} candidates.`
                }
              </FormHelperText>
            </FormControl>
          </Box>
          
          {/* Closing Date */}
          <Box mt={3}>
            <PollDateTimePicker
              value={normalizedPoll?.closing_datetime}
              onChange={(newValue) => {
                onChange({ 
                  closing_datetime: newValue,
                  settings: {
                    ...normalizedPoll.settings,
                    // Reset can_view_before_close if no closing date
                    can_view_before_close: !!newValue ? normalizedPoll.settings.can_view_before_close : false
                  }
                });
              }}
              disabled={!isEditing}
            />
          </Box>

          {/* Show live results option - only if closing date is set */}
          {normalizedPoll?.closing_datetime && (
            <Box mt={2}>
              <SettingSwitch
                checked={normalizedPoll.settings?.can_view_before_close || false}
                onChange={(e) => handleSettingsChange('can_view_before_close', e.target.checked)}
                label="Show live results before poll closes"
                disabled={!isEditing}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PollForm;