import React, { useState, useRef, useEffect, useReducer } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Chip,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Email as EmailIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import API from '../services/api';

// Import shared components
import PollForm from '../components/shared/PollForm';
import EmailListInput from '../components/shared/EmailListInput';

import VotingSettings from '../components/shared/VotingSettings';

// Poll Type Selection Component
const PollTypeSelector = ({ pollType, onChange }) => (
  <Box mt={3} mb={3}>
    <Typography variant="h6" gutterBottom>
      Poll Type
    </Typography>
    <ToggleButtonGroup
      value={pollType}
      exclusive
      onChange={onChange}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value="public" sx={{ py: 2 }}>
        <PublicIcon sx={{ mr: 1 }} />
        <Box textAlign="left">
          <Typography variant="subtitle1">Public Poll</Typography>
          <Typography variant="caption" display="block">
            Anyone with the link can vote
          </Typography>
        </Box>
      </ToggleButton>
      <ToggleButton value="private" sx={{ py: 2 }}>
        <LockIcon sx={{ mr: 1 }} />
        <Box textAlign="left">
          <Typography variant="subtitle1">Private Poll</Typography>
          <Typography variant="caption" display="block">
            Only invited voters can vote
          </Typography>
        </Box>
      </ToggleButton>
    </ToggleButtonGroup>

    {/* Poll Type Info Cards */}
    <Collapse in={pollType === 'public'}>
      <Box sx={{ 
        backgroundColor: 'rgba(25, 118, 210, 0.08)', 
        borderRadius: 2,
        p: 2,
        mb: 2
      }}>
        <Typography variant="body2" color="text.primary" gutterBottom>
          <strong>Public Poll Features:</strong>
        </Typography>
        <Typography variant="body2" color="text.primary" component="div">
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Anyone with the link can vote</li>
            <li>Option to allow write-in candidates</li>
            <li>Great for quick decisions and brainstorming</li>
          </ul>
        </Typography>
      </Box>
    </Collapse>

    <Collapse in={pollType === 'private'}>
      <Box sx={{ 
        backgroundColor: 'rgba(237, 108, 2, 0.08)', 
        borderRadius: 2,
        p: 2,
        mb: 2
      }}>
        <Typography variant="body2" color="text.primary" gutterBottom>
          <strong>Private Poll Features:</strong>
        </Typography>
        <Typography variant="body2" color="text.primary" component="div">
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Only invited voters can participate</li>
            <li>Each voter gets a unique secure token via email</li>
            <li>No write-in options allowed</li>
            <li>Perfect for formal elections and sensitive decisions</li>
          </ul>
        </Typography>
      </Box>
    </Collapse>
  </Box>
);

// Auth Method Selector Component
const AuthMethodSelector = ({ authMethod, onChange, formData, onFormDataChange, errors, refs }) => (
  <Box mt={3} mb={3}>
    <Typography variant="h6" gutterBottom>
      Poll Management
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      How would you like to manage this poll later?
    </Typography>
    
    <ToggleButtonGroup
      value={authMethod}
      exclusive
      onChange={onChange}
      fullWidth
      sx={{ mb: 2 }}
    >
      <ToggleButton value="none" sx={{ py: 2 }}>
        <LinkIcon sx={{ mr: 1 }} />
        <Box textAlign="left">
          <Typography variant="subtitle1">Link Only</Typography>
          <Typography variant="caption" display="block">
            Save the admin link (simplest)
          </Typography>
        </Box>
      </ToggleButton>
      <ToggleButton value="password" sx={{ py: 2 }}>
        <LockIcon sx={{ mr: 1 }} />
        <Box textAlign="left">
          <Typography variant="subtitle1">Custom Password</Typography>
          <Typography variant="caption" display="block">
            Set your own admin password
          </Typography>
        </Box>
      </ToggleButton>
      <ToggleButton value="email" sx={{ py: 2 }}>
        <EmailIcon sx={{ mr: 1 }} />
        <Box textAlign="left">
          <Typography variant="subtitle1">Email Dashboard</Typography>
          <Typography variant="caption" display="block">
            Manage all your polls in one place
          </Typography>
        </Box>
      </ToggleButton>
    </ToggleButtonGroup>

    {/* Auth Method Specific Fields */}
    <Collapse in={authMethod === 'password'}>
      <Box sx={{ 
        backgroundColor: 'rgba(237, 108, 2, 0.08)', 
        borderRadius: 2,
        p: 2,
        mb: 2 
      }}>
        <TextField
          fullWidth
          type="password"
          label="Admin Password"
          value={formData.admin_password}
          onChange={(e) => onFormDataChange({ admin_password: e.target.value })}
          helperText="You'll need this password to access the admin panel"
          margin="normal"
          error={errors.admin_password}
          inputRef={(el) => {
            if (refs.current) refs.current.admin_password = el;
          }}
        />
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Note:</strong> Choose a password you'll remember. You'll still get a direct admin link as backup.
          </Typography>
        </Alert>
      </Box>
    </Collapse>

    <Collapse in={authMethod === 'email'}>
      <Box sx={{ 
        backgroundColor: 'rgba(76, 175, 80, 0.08)', 
        borderRadius: 2,
        p: 2,
        mb: 2 
      }}>
        <TextField
          fullWidth
          type="email"
          label="Your Email Address"
          value={formData.creator_email}
          onChange={(e) => onFormDataChange({ creator_email: e.target.value })}
          helperText="Access all your polls from one dashboard"
          margin="normal"
          error={errors.creator_email}
          inputRef={(el) => {
            if (refs.current) refs.current.creator_email = el;
          }}
          InputProps={{
            startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Benefits:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>View all your polls in one place</li>
              <li>Never lose access to your polls</li>
              <li>Get a personal dashboard link</li>
            </ul>
          </Typography>
        </Alert>
      </Box>
    </Collapse>

    <Collapse in={authMethod === 'none'}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" component="div">
          <strong>Important:</strong> You'll receive a unique admin link after creating the poll. 
          Make sure to save it - it's the only way to manage your poll!
        </Typography>
      </Alert>
    </Collapse>
  </Box>
);


const CreatePoll = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const errorRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showValidationError, setShowValidationError] = useState(false); // ADD THIS LINE
  const [, forceUpdate] = useReducer(x => x + 1, 0); // ADD THIS FOR FORCE UPDATE
  
  // Form state
  const [pollType, setPollType] = useState('public');
  const [authMethod, setAuthMethod] = useState('none');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: [
      { name: '', description: '' },
      { name: '', description: '' }
    ],
    is_private: false,
    voter_emails: [],
    closing_datetime: null,
    admin_password: '',
    creator_email: '',
    settings: {
      allow_ties: true,
      require_complete_ranking: false,
      randomize_options: false,
      allow_write_in: false,
      show_detailed_results: true,
      show_rankings: true,
      results_visibility: 'public',
      can_view_before_close: false,
      // num_ranks: undefined, // REMOVED - let PollForm calculate it
    },
  });

  // Debug logging
  useEffect(() => {
    console.log('[DEBUG] State updated - showValidationError:', showValidationError);
    console.log('[DEBUG] State updated - fieldErrors:', fieldErrors);
  }, [showValidationError, fieldErrors]);

  // Handle poll type change
  const handlePollTypeChange = (event, newType) => {
    if (newType !== null) {
      setPollType(newType);
      setFormData({
        ...formData,
        is_private: newType === 'private',
        settings: {
          ...formData.settings,
          allow_write_in: false,
        },
      });
    }
  };

  // Handle auth method change
  const handleAuthMethodChange = (event, newMethod) => {
    if (newMethod !== null) {
      setAuthMethod(newMethod);
      setFormData({
        ...formData,
        admin_password: '',
        creator_email: ''
      });
    }
  };

  // Handle form data changes
  const handleFormDataChange = (updates) => {
    setFormData({ ...formData, ...updates });
    
    // Clear relevant errors
    Object.keys(updates).forEach(key => {
      if (fieldErrors[key]) {
        setFieldErrors({ ...fieldErrors, [key]: false });
      }
    });
    setShowValidationError(false);
  };

  // Email management
const addEmail = (emailsToAdd) => {
  // Handle both single email (string) and multiple emails (array)
  const emails = Array.isArray(emailsToAdd) ? emailsToAdd : [emailsToAdd];
  
  // Filter out duplicates
  const newEmails = emails.filter(email => 
    !formData.voter_emails.includes(email)
  );
  
  if (newEmails.length > 0) {
    handleFormDataChange({
      voter_emails: [...formData.voter_emails, ...newEmails]
    });
  }
};
const updateEmails = (newEmailList) => {
  handleFormDataChange({
    voter_emails: newEmailList
  });
};

const updateEmailList = (newEmailList) => {
  handleFormDataChange({
    voter_emails: newEmailList
  });
};

  const removeEmail = (emailToRemove) => {
    handleFormDataChange({
      voter_emails: formData.voter_emails.filter(email => email !== emailToRemove)
    });
  };

  // Validate form
  const validateForm = () => {
    console.log('[DEBUG] validateForm called');
    const errors = {};
    
    if (!formData.title.trim()) {
      console.log('[DEBUG] Title is empty');
      errors.title = true;
    }
    
    const validOptions = formData.options.filter(opt => opt.name.trim() !== '');
    console.log('[DEBUG] Valid options count:', validOptions.length);
    if (validOptions.length < 2) {
      formData.options.forEach((opt, index) => {
        if (!opt.name.trim()) {
          console.log(`[DEBUG] Option ${index} is empty`);
          errors[`option_${index}_name`] = true;
        }
      });
    }
    
    // Check for duplicate option names
    const optionNames = formData.options
      .map(opt => opt.name.trim().toLowerCase())
      .filter(name => name !== '');
    
    const duplicates = new Set();
    const seen = new Set();
    
    optionNames.forEach(name => {
      if (seen.has(name)) {
        duplicates.add(name);
      }
      seen.add(name);
    });
    
    if (duplicates.size > 0) {
      console.log('[DEBUG] Duplicate names found:', Array.from(duplicates));
      formData.options.forEach((opt, index) => {
        if (duplicates.has(opt.name.trim().toLowerCase())) {
          errors[`option_${index}_name`] = true;
        }
      });
    }
    
    if (pollType === 'private' && formData.voter_emails.length === 0) {
      console.log('[DEBUG] Private poll with no emails');
      errors.voter_emails = true;
    }
    
    if (authMethod === 'password' && !formData.admin_password.trim()) {
      console.log('[DEBUG] Password auth with no password');
      errors.admin_password = true;
    }
    
    if (authMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.creator_email.trim() || !emailRegex.test(formData.creator_email.trim())) {
        console.log('[DEBUG] Invalid creator email');
        errors.creator_email = true;
      }
    }
    
    console.log('[DEBUG] Final validation errors:', errors);
    return errors;
  };

  // Focus on first error field
  const focusFirstError = (errors) => {
    const errorKeys = Object.keys(errors);
    console.log('[DEBUG] focusFirstError - errorKeys:', errorKeys);
    
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      const element = errorRefs.current[firstErrorKey];
      
      console.log('[DEBUG] First error element:', element);
      
      if (element) {
        element.focus();
        
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          const scrollY = window.scrollY + rect.top - 200;
          
          window.scrollTo({
            top: scrollY,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  };

  // Submit form


const handleSubmit = async () => {  // REMOVE: event parameter
  console.log('[DEBUG] handleSubmit called');
  // REMOVE: event.preventDefault(); - not needed anymore
  setError('');
  setShowValidationError(false);
  
  const errors = validateForm();
  console.log('[DEBUG] Validation errors:', errors);
  console.log('[DEBUG] Error count:', Object.keys(errors).length);
  
  if (Object.keys(errors).length > 0) {
    console.log('[DEBUG] Form has errors, updating state');
    setFieldErrors(errors);
    setShowValidationError(true);
    forceUpdate();
    
    setTimeout(() => {
      console.log('[DEBUG] After state update - showValidationError should be true');
      focusFirstError(errors);
    }, 0);
    
    // Don't set error message at top - just return
    return;
  }
    
    console.log('[DEBUG] Form is valid, proceeding with submission');
    setShowValidationError(false);
    setLoading(true);

    try {
      const cleanedOptions = formData.options
        .filter(opt => opt.name.trim() !== '')
        .map(opt => ({
          name: opt.name.trim(),
          description: opt.description ? opt.description.trim() : null
        }));

      // Prepare settings with proper num_ranks value
      const settings = {
        ...formData.settings,
        // Ensure num_ranks is either a number or null (not undefined)
        num_ranks: formData.settings.num_ranks ? parseInt(formData.settings.num_ranks) : null
      };

      const pollData = {
        ...formData,
        candidates: cleanedOptions,
        settings: settings,
        closing_datetime: formData.closing_datetime 
          ? (dayjs.isDayjs(formData.closing_datetime) 
              ? formData.closing_datetime.toISOString() 
              : formData.closing_datetime)
          : null,
        tags: [],
        admin_password: authMethod === 'password' ? formData.admin_password : null,
        creator_email: authMethod === 'email' ? formData.creator_email.trim().toLowerCase() : null,
      };

      const response = await API.post('/polls/', pollData);
      setSuccess(true);
      
      setTimeout(() => {
        const currentParams = new URLSearchParams(window.location.search);
        const isEmbedded = currentParams.get('embedded') === 'true';
        
        navigate('/poll-created' + (isEmbedded ? '?embedded=true' : ''), {
          state: {
            pollId: response.data.short_id,
            pollTitle: response.data.title,
            authMethod: authMethod,
            adminToken: response.data.admin_token,
            creatorEmail: authMethod === 'email' ? formData.creator_email : null,
            voterEmails: formData.voter_emails  // ADD THIS LINE!
          }
        });
      }, 1000);
    } catch (err) {
      let errorMessage = 'Failed to create poll';
      
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Debug render
  console.log('[DEBUG RENDER] showValidationError:', showValidationError);
  console.log('[DEBUG RENDER] fieldErrors:', fieldErrors);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ mt: isEmbedded ? 0 : '134.195px', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{  borderRadius: 2, p: { xs: 3, md: 4 } }}>
            <Box display="flex" alignItems="center" mb={3}>
              
              <Typography variant="h3" component="h1">
                Create a New Poll
              </Typography>
            </Box>

            <Collapse in={error !== ''}>
              <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
                {error}
              </Alert>
            </Collapse>

            <Collapse in={success}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Poll created successfully! Redirecting to poll details...
              </Alert>
            </Collapse>

            <form onSubmit={handleSubmit}>
              {/* Poll Type Selection */}
              <PollTypeSelector
                pollType={pollType}
                onChange={handlePollTypeChange}
              />

              {/* Auth Method Selection */}
              <AuthMethodSelector
                authMethod={authMethod}
                onChange={handleAuthMethodChange}
                formData={formData}
                onFormDataChange={handleFormDataChange}
                errors={fieldErrors}
                refs={errorRefs}
              />

              <Divider sx={{ my: 4, opacity: 0.3 }} />

              {/* Main Poll Form */}
              <PollForm
                poll={formData}
                onChange={handleFormDataChange}
                isEditing={true}
                canModifyOptions={true}
                errors={fieldErrors}
                isPrivatePoll={formData.is_private}
                showCompletedToggle={false}
                refs={errorRefs}
              />

              <Divider sx={{ my: 4, opacity: 0.3 }} />

              {/* Email Addresses for Private Poll */}
              <Collapse in={pollType === 'private'}>
              <EmailListInput
                emails={formData.voter_emails}
                onChange={updateEmailList}
                error={fieldErrors.voter_emails}
                required={true}
                label="Voter Email Addresses"
                inputRef={(el) => {
                  if (errorRefs.current) errorRefs.current.voter_emails = el;
                }}
              />
              </Collapse>

{/* Submit Button */}
<Box mt={4}>
  <Box display="flex" justifyContent="flex-end">
    <Button
      type="button"
      onClick={() => navigate('/')}
      disabled={loading}
      sx={{ mr: 2 }}
    >
      Cancel
    </Button>
    <Button
      type="button"  // CHANGE: from "submit" to "button"
      variant="contained"
      disabled={loading}
      startIcon={<SaveIcon />}
      size="large"
      color={showValidationError ? "error" : "primary"}
      onClick={(e) => {  // ADD: onClick handler
        console.log('[DEBUG] Create Poll button clicked!');
        e.preventDefault();
        handleSubmit();
      }}
    >
      {loading ? 'Creating...' : 'Create Poll'}
    </Button>
  </Box>
  
  {/* Error message BELOW the buttons */}
{/* Error message BELOW the buttons */}
{showValidationError && (
  <Box mt={2}>
    <Alert severity="error">
      Please fix the following errors:
      <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
        {!formData.title.trim() && <li>Poll title is required</li>}
        {Object.keys(fieldErrors).filter(key => key.startsWith('option_')).length > 0 && (
          <li>All options must have names, and each name must be unique</li>
        )}
        {pollType === 'private' && fieldErrors.voter_emails && (
          <li>At least one voter email is required for private polls</li>
        )}
        {authMethod === 'password' && fieldErrors.admin_password && (
          <li>Admin password is required</li>
        )}
        {authMethod === 'email' && fieldErrors.creator_email && (
          <li>Valid email address is required</li>
        )}
      </ul>
    </Alert>
  </Box>
)}
</Box>
            </form>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default CreatePoll;