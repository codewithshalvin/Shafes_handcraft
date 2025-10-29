/**
 * Image Utilities for Photo Upload Feature
 * Handles image compression, validation, and conversion
 */

/**
 * Compress an image file to reduce size while maintaining quality
 * @param {File} file - The original image file
 * @param {number} maxWidth - Maximum width for the compressed image
 * @param {number} maxHeight - Maximum height for the compressed image
 * @param {number} quality - Compression quality (0.1 to 1.0)
 * @returns {Promise<string>} - Base64 encoded compressed image
 */
export const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file before upload
 * @param {File} file - The image file to validate
 * @returns {Object} - Validation result with isValid boolean and error message
 */
export const validateImage = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' 
    };
  }

  if (file.size > maxSize) {
    return { 
      isValid: false, 
      error: `File size too large. Please upload an image smaller than ${maxSize / 1024 / 1024}MB.` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Get image dimensions from file
 * @param {File} file - The image file
 * @returns {Promise<Object>} - Object with width and height properties
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image to get dimensions'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 encoded string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to convert file to base64'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Generate a thumbnail from an image file
 * @param {File} file - The original image file
 * @param {number} size - Thumbnail size (width and height)
 * @returns {Promise<string>} - Base64 encoded thumbnail
 */
export const generateThumbnail = (file, size = 150) => {
  return compressImage(file, size, size, 0.7);
};

/**
 * Download base64 image as file
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} filename - Name for the downloaded file
 */
export const downloadBase64Image = (base64Data, filename = 'image.jpg') => {
  try {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error('Failed to download image');
  }
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create a preview URL for a file
 * @param {File} file - The file to create preview for
 * @returns {string} - Object URL for preview
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free up memory
 * @param {string} url - The object URL to revoke
 */
export const revokePreviewUrl = (url) => {
  URL.revokeObjectURL(url);
};

/**
 * Check if the current browser supports the required APIs
 * @returns {boolean} - True if all required APIs are supported
 */
export const isImageUploadSupported = () => {
  return !!(
    window.File &&
    window.FileReader &&
    window.FileList &&
    window.Blob &&
    document.createElement('canvas').getContext
  );
};

export default {
  compressImage,
  validateImage,
  getImageDimensions,
  fileToBase64,
  generateThumbnail,
  downloadBase64Image,
  formatFileSize,
  createPreviewUrl,
  revokePreviewUrl,
  isImageUploadSupported
};