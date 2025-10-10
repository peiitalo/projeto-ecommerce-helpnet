import 'dotenv/config';
import { cloudinary } from '../config/cloudinary.js';

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');

    // Test connection
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', pingResult);

    // Test basic upload with a small test image
    console.log('Testing basic upload...');
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel PNG

    const uploadResult = await cloudinary.uploader.upload(testImageData, {
      folder: 'test',
      public_id: 'test-image',
      overwrite: true,
    });

    console.log('✅ Upload successful:', {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });

    // Optionally delete the test image
    console.log('Cleaning up test image...');
    await cloudinary.uploader.destroy('test/test-image');
    console.log('✅ Test image deleted successfully');

    console.log('Cloudinary test completed successfully!');
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCloudinary();