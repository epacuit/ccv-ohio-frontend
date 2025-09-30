// components/vote/WriteInSection.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

const WriteInSection = ({ 
  candidates = [], 
  existingWriteIns = [], 
  onAddWriteIn, 
  onError, 
  disabled = false 
}) => {
  const [writeInValue, setWriteInValue] = useState('');
  const [addingWriteIn, setAddingWriteIn] = useState(false);
  const [localError, setLocalError] = useState('');

  // Normalize name for comparison (trim, lowercase, remove extra spaces)
  const normalizeName = (name) => {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Check if name conflicts with existing candidates
  const checkNameConflict = (name) => {
    const normalizedInput = normalizeName(name);
    
    // Check against poll candidates
    const conflictWithPoll = candidates.some(candidate => 
      normalizeName(candidate.name) === normalizedInput
    );
    
    // Check against existing write-ins for this voter
    const conflictWithWriteIns = existingWriteIns.some(writeIn => 
      normalizeName(writeIn.name) === normalizedInput
    );
    
    return conflictWithPoll || conflictWithWriteIns;
  };

  const handleAddWriteIn = async () => {
    const trimmedValue = writeInValue.trim();
    
    if (!trimmedValue) {
      setLocalError('Please enter a candidate name');
      return;
    }

    // Check for name conflicts
    if (checkNameConflict(trimmedValue)) {
      setLocalError('This candidate name already exists on your ballot');
      return;
    }

    setAddingWriteIn(true);
    setLocalError('');

    try {
      // Generate unique ID for this write-in
      const writeInId = `writein_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newWriteIn = {
        id: writeInId,
        name: trimmedValue,
        is_write_in: true
      };

      onAddWriteIn(newWriteIn);
      setWriteInValue('');
      
    } catch (err) {
      setLocalError('Failed to add write-in candidate');
      onError && onError('Failed to add write-in candidate');
    } finally {
      setAddingWriteIn(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Add Write-in Candidate
      </Typography>
      
      {localError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocalError('')}>
          {localError}
        </Alert>
      )}
      
      <Box display="flex" gap={2} alignItems="flex-start">
        <TextField
          value={writeInValue}
          onChange={(e) => setWriteInValue(e.target.value)}
          placeholder="Enter candidate name"
          variant="outlined"
          size="small"
          fullWidth
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddWriteIn();
            }
          }}
          disabled={addingWriteIn || disabled}
          error={!!localError}
        />
        <Button
          variant="contained"
          onClick={handleAddWriteIn}
          disabled={addingWriteIn || disabled || !writeInValue.trim()}
          startIcon={addingWriteIn ? <CircularProgress size={20} /> : <PersonAddIcon />}
          sx={{ minWidth: 'auto' }}
        >
          Add
        </Button>
      </Box>
      
      {existingWriteIns.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {existingWriteIns.length} write-in candidate{existingWriteIns.length !== 1 ? 's' : ''} added to your ballot
        </Typography>
      )}
    </Box>
  );
};

export default WriteInSection;