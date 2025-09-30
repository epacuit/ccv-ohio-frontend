import React from 'react';
import {
  Box,
  Grid,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import PollOptionCard from './PollOptionCard';

/**
 * PollOptionsList Component
 * 
 * FIXED VERSION:
 * - Passes canModifyOptions to PollOptionCard
 * - Shows clear message about what can be edited
 */
const PollOptionsList = ({
  options,
  isEditing = false,
  onOptionChange,
  onOptionAdd,
  onOptionRemove,
  onImageUpload,
  onImageRemove,
  uploadingImages = {},
  fieldErrors = {},
  errorRefs = {},
  minOptions = 2,
  canModifyOptions = true,
  showAddButton = true,
}) => {
  const handleOptionChange = (index, field, value) => {
    if (onOptionChange) {
      onOptionChange(index, field, value);
    }
  };

  const handleImageUpload = async (index, file) => {
    if (onImageUpload) {
      await onImageUpload(index, file);
    }
  };

  const handleImageRemove = (index) => {
    if (onImageRemove) {
      onImageRemove(index);
    }
  };

  const handleRemoveOption = (index) => {
    if (onOptionRemove && options.length > minOptions) {
      onOptionRemove(index);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Poll Options ({options.length})
        </Typography>
        {isEditing && showAddButton && canModifyOptions && (
          <Button
            startIcon={<AddIcon />}
            onClick={onOptionAdd}
            size="small"
          >
            Add Option
          </Button>
        )}
      </Box>

      {/* Clear message when editing with votes */}
      {!canModifyOptions && isEditing && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Limited editing:</strong> Candidate names are locked, but you can still edit descriptions.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={2}>
        {options.map((option, index) => (
          <Grid item xs={12} md={isEditing ? 12 : 6} key={option.id || index}>
            <PollOptionCard
              option={option}
              index={index}
              isEditing={isEditing}
              onNameChange={(value) => handleOptionChange(index, 'name', value)}
              onDescriptionChange={(value) => handleOptionChange(index, 'description', value)}
              onImageUpload={(file) => handleImageUpload(index, file)}
              onImageRemove={() => handleImageRemove(index)}
              onDelete={() => handleRemoveOption(index)}
              canDelete={options.length > minOptions}
              isUploading={uploadingImages[index]}
              hasError={fieldErrors[`option_${index}_name`]}
              inputRef={(el) => {
                if (errorRefs && errorRefs.current) {
                  errorRefs.current[`option_${index}_name`] = el;
                }
              }}
              canModifyOptions={canModifyOptions}  // PASS THIS TO CARD
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PollOptionsList;