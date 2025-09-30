import React from 'react';
import {
  Box,
  IconButton,
  Button,
  CircularProgress,
  Typography,
  Avatar,
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

/**
 * ImageUploadButton Component
 * 
 * Reusable image upload button with preview and loading state
 * Used in both CreatePoll and Admin components
 */
const ImageUploadButton = ({
  imageUrl,
  onUpload,
  onRemove,
  isUploading = false,
  disabled = false,
  size = 80,
  label = "Optional",
  id,
}) => {
  // Add this debugging
  React.useEffect(() => {
    if (imageUrl && !imageUrl.startsWith('data:')) {
      console.log('ImageUploadButton - Trying to load image from:', imageUrl);
      
      // Test if the image actually loads
      const img = new Image();
      img.onload = () => console.log('Image loaded successfully:', imageUrl);
      img.onerror = () => console.error('Failed to load image:', imageUrl);
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onUpload) {
      onUpload(file);
    }
    event.target.value = '';
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id={id}
        type="file"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <label htmlFor={id}>
        <IconButton
          color="primary"
          component="span"
          disabled={disabled || isUploading}
          sx={{ p: 0 }}
        >
          {imageUrl ? (
            <Box position="relative">
              <Avatar
                src={imageUrl}
                variant="rounded"
                sx={{ 
                  width: size, 
                  height: size,
                  borderRadius: 2,
                }}
                onError={(e) => {
                  console.error('Avatar onError triggered for:', imageUrl);
                }}
              >
                <ImageIcon sx={{ fontSize: size * 0.4, color: 'grey.500' }} />
              </Avatar>
              {isUploading && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width={size}
                  height={size}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgcolor="rgba(0, 0, 0, 0.5)"
                  borderRadius={2}
                >
                  <CircularProgress size={size * 0.5} sx={{ color: 'white' }} />
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                width: size,
                height: size,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': disabled ? {} : {
                  bgcolor: 'grey.200',
                  cursor: 'pointer',
                },
              }}
            >
              <AddPhotoIcon sx={{ fontSize: size * 0.4, color: 'grey.500' }} />
            </Box>
          )}
        </IconButton>
      </label>
      
      {imageUrl && onRemove ? (
        <Button
          size="small"
          color="error"
          onClick={onRemove}
          sx={{ mt: 0.5, display: 'block', mx: 'auto' }}
          disabled={isUploading}
        >
          Remove
        </Button>
      ) : (
        !imageUrl && label && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {label}
          </Typography>
        )
      )}
    </Box>
  );
};

export default ImageUploadButton;