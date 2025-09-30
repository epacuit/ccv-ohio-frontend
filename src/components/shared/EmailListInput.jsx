import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  Stack,
  Alert,
  FormHelperText,
  Paper,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';

/**
 * EmailListInput Component
 * 
 * A reusable component for entering and managing email lists.
 * Supports multiple input methods:
 * - Line-by-line entry
 * - Comma-separated
 * - Paste from spreadsheet
 */
const EmailListInput = ({
  emails = [],
  onChange,
  label = 'Email Addresses',
  placeholder = 'Enter email addresses, one per line or comma-separated',
  helperText = '',
  error = false,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [parseError, setParseError] = useState('');

  // Convert emails array to display text
  useEffect(() => {
    if (emails.length > 0 && !inputText) {
      setInputText(emails.join('\n'));
    }
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const parseEmails = (text) => {
    if (!text.trim()) {
      onChange([]);
      setParseError('');
      return;
    }

    // Split by newlines, commas, semicolons, and whitespace
    const rawEmails = text
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    // Validate and deduplicate
    const validEmails = [];
    const invalidEmails = [];
    const seen = new Set();

    for (const email of rawEmails) {
      const cleanEmail = email.toLowerCase();
      
      if (seen.has(cleanEmail)) {
        continue; // Skip duplicates
      }
      
      if (validateEmail(cleanEmail)) {
        validEmails.push(cleanEmail);
        seen.add(cleanEmail);
      } else if (email) {
        invalidEmails.push(email);
      }
    }

    // Update state
    onChange(validEmails);
    
    // Set error if there are invalid emails
    if (invalidEmails.length > 0) {
      setParseError(`Invalid email(s): ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? '...' : ''}`);
    } else {
      setParseError('');
    }
  };

  const handleInputChange = (event) => {
    const text = event.target.value;
    setInputText(text);
    parseEmails(text);
  };

  const handlePaste = (event) => {
    // Handle paste from Excel/Sheets
    const text = event.clipboardData.getData('text');
    const combined = inputText + (inputText ? '\n' : '') + text;
    setInputText(combined);
    parseEmails(combined);
  };

  const removeEmail = (emailToRemove) => {
    const newEmails = emails.filter(e => e !== emailToRemove);
    onChange(newEmails);
    
    // Update input text
    setInputText(newEmails.join('\n'));
  };

  const clearAll = () => {
    setInputText('');
    onChange([]);
    setParseError('');
  };

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        rows={6}
        label={label}
        placeholder={placeholder}
        value={inputText}
        onChange={handleInputChange}
        onPaste={handlePaste}
        error={error || !!parseError}
        disabled={disabled}
        helperText={parseError || helperText}
        sx={{ mb: 2 }}
      />
      
      {/* Email count and validation status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          {emails.length === 0 
            ? 'No valid emails entered'
            : `${emails.length} valid email${emails.length !== 1 ? 's' : ''}`}
        </Typography>
        {emails.length > 0 && (
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={clearAll}
          >
            Clear all
          </Typography>
        )}
      </Box>
      
      {/* Display valid emails as chips */}
      {emails.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 200, overflowY: 'auto' }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {emails.map((email) => (
              <Chip
                key={email}
                label={email}
                size="small"
                onDelete={disabled ? undefined : () => removeEmail(email)}
                icon={<EmailIcon fontSize="small" />}
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        </Paper>
      )}
      
      {/* Tips */}
      {emails.length === 0 && !inputText && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Tips:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mb: 0, pl: 2 }}>
            <li>Enter one email per line</li>
            <li>Or use commas to separate: email1@example.com, email2@example.com</li>
            <li>You can paste from Excel or Google Sheets</li>
            <li>Duplicates are automatically removed</li>
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default EmailListInput;