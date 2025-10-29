/**
 * Utility functions for handling customer photo uploads
 */

/**
 * Upload a customer photo file to the backend
 * @param {File} file - The image file to upload
 * @param {string} token - User authentication token (optional)
 * @returns {Promise<Object>} Upload result with file path
 */
export const uploadCustomerPhoto = async (file, token = null) => {
  try {
    console.log('📷 Uploading customer photo:', file.name);
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);
    
    // Set up headers
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Upload to backend
    const response = await fetch('http://localhost:5000/api/customer/upload-photo', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Upload failed');
    }
    
    console.log('✅ Photo uploaded successfully:', result.data.filePath);
    
    return {
      success: true,
      filePath: result.data.filePath,
      fileName: result.data.fileName,
      originalName: result.data.originalName,
      size: result.data.size,
      // Keep compatibility with existing code
      image: `http://localhost:5000${result.data.filePath}`,
      name: result.data.originalName,
      type: file.type,
      uploadedAt: result.data.uploadedAt || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Photo upload failed:', error);
    throw error;
  }
};

/**
 * Convert a base64 image to a File object
 * @param {string} base64String - Base64 image string
 * @param {string} filename - Desired filename
 * @returns {File} File object
 */
export const base64ToFile = (base64String, filename = 'image.jpg') => {
  try {
    // Extract mime type and data
    const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 string');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convert to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create File object
    return new File([bytes], filename, { type: mimeType });
    
  } catch (error) {
    console.error('❌ Base64 to File conversion failed:', error);
    throw error;
  }
};

/**
 * Handle customer photo for cart (upload file to backend)
 * @param {File} file - The uploaded file
 * @param {string} token - User token
 * @returns {Promise<Object>} Photo data with file path
 */
export const handleCustomerPhotoUpload = async (file, token) => {
  try {
    console.log('🎯 Processing customer photo for cart...');
    
    if (!file) {
      return null;
    }
    
    // Upload file to backend
    const uploadResult = await uploadCustomerPhoto(file, token);
    
    return {
      filePath: uploadResult.filePath,
      image: uploadResult.image, // Full URL for compatibility
      name: uploadResult.originalName,
      size: uploadResult.size,
      type: file.type,
      uploadedAt: uploadResult.uploadedAt
    };
    
  } catch (error) {
    console.error('❌ Customer photo processing failed:', error);
    throw error;
  }
};

/**
 * Handle multiple customer photos for cart (upload files to backend)
 * @param {Array<Object>} photos - Array of photo objects with file, order info
 * @param {string} token - User token
 * @returns {Promise<Array>} Array of processed photo data with file paths
 */
export const handleMultipleCustomerPhotos = async (photos, token) => {
  try {
    console.log('🎯 Processing multiple customer photos for cart...', photos.length);
    
    if (!photos || photos.length === 0) {
      return [];
    }
    
    const processedPhotos = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (photo.file) {
        try {
          // Upload file to backend
          const uploadResult = await uploadCustomerPhoto(photo.file, token);
          
          processedPhotos.push({
            id: photo.id,
            filePath: uploadResult.filePath,
            image: uploadResult.image, // Full URL for compatibility
            name: uploadResult.originalName,
            size: uploadResult.size,
            type: photo.file.type,
            order: photo.order || i + 1,
            uploadedAt: uploadResult.uploadedAt
          });
          
        } catch (error) {
          console.error(`❌ Failed to upload photo ${i + 1}:`, error);
          // Continue with other photos even if one fails
          continue;
        }
      }
    }
    
    console.log(`✅ Successfully processed ${processedPhotos.length}/${photos.length} photos`);
    return processedPhotos;
    
  } catch (error) {
    console.error('❌ Multiple customer photos processing failed:', error);
    throw error;
  }
};

/**
 * Validate photo array for upload
 * @param {Array} photos - Array of photo objects
 * @returns {Object} Validation result
 */
export const validatePhotos = (photos) => {
  if (!photos || !Array.isArray(photos)) {
    return { valid: false, message: 'Invalid photos array' };
  }
  
  if (photos.length === 0) {
    return { valid: true, message: 'No photos to validate' };
  }
  
  if (photos.length > 10) {
    return { valid: false, message: 'Maximum 10 photos allowed' };
  }
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    if (!photo.file) {
      return { valid: false, message: `Photo ${i + 1} is missing file` };
    }
    
    if (!photo.file.type.startsWith('image/')) {
      return { valid: false, message: `Photo ${i + 1} is not a valid image` };
    }
    
    if (photo.file.size > 5 * 1024 * 1024) {
      return { valid: false, message: `Photo ${i + 1} exceeds 5MB size limit` };
    }
  }
  
  return { valid: true, message: 'All photos are valid' };
};
