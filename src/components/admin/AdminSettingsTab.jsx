import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  List,
  ListItem,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Card,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteForever as DeleteForeverIcon,
  ClearAll as ClearAllIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

// Import THE SAME shared components used in CreatePoll
import PollForm from '../shared/PollForm';
import EmailListInput from '../shared/EmailListInput';
import VotingSettings from '../shared/VotingSettings';

/**
 * AdminSettingsTab Component
 * Uses the SAME components as CreatePoll for consistency
 */
const AdminSettingsTab = ({
  poll,
  editedPoll,
  editMode,
  saving,
  analytics,
  uploadingImages,
  voterEmails,
  emailTokens,
  regeneratingToken,
  onEditToggle,
  onPollChange,
  onImageUpload,
  onImageRemove,
  onSave,
  onDeletePoll,
  onDeleteBallots,
  onUpdateVoterEmails,
  onRegenerateToken,
}) => {
  const [copiedEmail, setCopiedEmail] = useState('');

  const handlePollTypeChange = (event, newType) => {
    if (newType !== null) {
      onPollChange({ 
        is_private: newType === 'private',
        settings: {
          ...editedPoll.settings,
          allow_write_in: newType === 'private' ? false : editedPoll.settings.allow_write_in,
        }
      });
    }
  };

  const copyVoteLink = (email) => {
    const baseUrl = window.location.origin;
    const token = emailTokens[email];
    const link = `${baseUrl}/vote/${poll.id}?token=${token}`;
    
    navigator.clipboard.writeText(link);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(''), 2000);
  };

  const canModifyOptions = !analytics || analytics.totalVotes === 0;

  return (
    <>
      {/* Header */}
      <Typography variant="h5" gutterBottom>
        Poll Configuration
      </Typography>

      {/* Action Buttons */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={1} mb={4}>
        {editMode ? (
          <>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={onEditToggle}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEditToggle}
            >
              Edit Settings
            </Button>
          </>
        )}
      </Box>

      {/* Poll Type - SAME as CreatePoll */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Poll Type
        </Typography>
        <ToggleButtonGroup
          value={editedPoll?.is_private ? 'private' : 'public'}
          exclusive
          onChange={editMode ? handlePollTypeChange : undefined}
          fullWidth
          disabled={!editMode}
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
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* PollForm - SAME component as CreatePoll */}
      <PollForm
        poll={editedPoll}
        onChange={onPollChange}
        onImageUpload={onImageUpload}
        onImageRemove={onImageRemove}
        isEditing={editMode}
        canModifyOptions={canModifyOptions}
        uploadingImages={uploadingImages}
        isPrivatePoll={editedPoll?.is_private}
        showCompletedToggle={true}
      />

      <Divider sx={{ my: 3 }} />

      {/* VotingSettings - SAME component as CreatePoll (includes date picker) */}
      {editedPoll?.settings && (
<VotingSettings
  settings={editedPoll.settings}
  onSettingChange={(key, value) => {
    onPollChange({
      settings: {
        ...editedPoll.settings,
        [key]: value
      }
    });
  }}
  isPrivatePoll={editedPoll.is_private}
  disabled={!editMode}
/>
      )}

      {/* Voter Emails for Private Polls */}
      {editedPoll?.is_private && (
        <>
          <Divider sx={{ my: 3 }} />
          
          {editMode ? (
            <EmailListInput
              emails={voterEmails}
              onChange={onUpdateVoterEmails}
              label="Voter Email Addresses"
              placeholder="Add more email addresses"
              required={true}
              disabled={!editMode}
            />
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Voter Email Addresses ({voterEmails.length})
              </Typography>
              
              <Card variant="outlined">
                <List sx={{ p: { xs: 1, sm: 2 } }}>
                  {voterEmails.map((email, index) => (
                    <React.Fragment key={email}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch', 
                        py: 2,
                        px: { xs: 1, sm: 2 }
                      }}>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium" 
                          gutterBottom
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {email}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TextField
                            size="small"
                            fullWidth
                            value={`${window.location.origin}/vote/${poll.id}?token=${emailTokens[email]}`}
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkIcon fontSize="small" />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Box display="flex" gap={0.5}>
                                    <Tooltip title={copiedEmail === email ? "Copied!" : "Copy voting link"}>
                                      <IconButton 
                                        onClick={() => copyVoteLink(email)}
                                        size="small"
                                        color={copiedEmail === email ? "success" : "default"}
                                        edge="end"
                                      >
                                        <CopyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Generate new voting link">
                                      <IconButton 
                                        onClick={() => onRegenerateToken(email)}
                                        size="small"
                                        disabled={regeneratingToken[email]}
                                        edge="end"
                                      >
                                        <RefreshIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </InputAdornment>
                              ),
                              sx: { 
                                fontSize: '0.875rem',
                                pr: 0,
                                '& input': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }
                              }
                            }}
                          />
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
};

export default AdminSettingsTab;