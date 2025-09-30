import API from '../services/api';

/**
 * Upload an image file to the server
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The URL of the uploaded image
 */
export const uploadImage = async (file) => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file');
  }
  
  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size should be less than 5MB');
  }

  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await API.post('/polls/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.image_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * Convert a file to base64 for preview
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};