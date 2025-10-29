// Quick test to verify photo upload endpoint
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testPhotoUpload() {
  try {
    console.log('🧪 Testing photo upload endpoint...');
    
    // Create a simple test image file
    const testImageContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Convert base64 to buffer
    const base64Data = testImageContent.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create temporary file
    fs.writeFileSync('temp-test.png', buffer);
    
    // Test upload
    const formData = new FormData();
    formData.append('photo', fs.createReadStream('temp-test.png'), 'test-photo.png');
    
    const response = await fetch('http://localhost:5000/api/customer/upload-photo', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📤 Upload response:', result);
    
    if (result.success) {
      console.log('✅ Photo upload endpoint is working!');
      console.log('📁 File saved to:', result.filePath);
      console.log('🔗 Access URL:', `http://localhost:5000${result.filePath}`);
    } else {
      console.log('❌ Upload failed:', result.message);
    }
    
    // Cleanup
    try {
      fs.unlinkSync('temp-test.png');
    } catch(e) {}
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhotoUpload();