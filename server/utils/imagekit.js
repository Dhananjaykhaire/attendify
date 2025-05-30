import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from multiple possible locations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Try loading from different possible env file locations
dotenv.config({ path: path.join(rootDir, '.env.local') });
dotenv.config({ path: path.join(rootDir, '.env') });

class ImageKitService {
  constructor() {
    this.isInitialized = false;
    this.imagekit = null;
    this.initializeImageKit();
  }

  initializeImageKit() {
    try {
      // Check for required environment variables
      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

      // Detailed validation
      if (!publicKey || !privateKey || !urlEndpoint) {
        const missing = [];
        if (!publicKey) missing.push('IMAGEKIT_PUBLIC_KEY');
        if (!privateKey) missing.push('IMAGEKIT_PRIVATE_KEY');
        if (!urlEndpoint) missing.push('IMAGEKIT_URL_ENDPOINT');
        
        console.warn(`ImageKit configuration incomplete. Missing: ${missing.join(', ')}`);
        console.warn(`Please check your .env.local file in: ${rootDir}`);
        console.warn('Current environment variables loaded from:', process.env.DOTENV_PATH || 'unknown');
        return;
      }

      // Validate URL format
      try {
        new URL(urlEndpoint);
      } catch (e) {
        console.error('Invalid IMAGEKIT_URL_ENDPOINT format. It should be a valid URL.');
        return;
      }

      // Initialize ImageKit
      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint: urlEndpoint.replace(/\/$/, '') + '/', // Ensure URL ends with /
      });

      this.isInitialized = true;
      console.log('ImageKit initialized with:', {
        publicKey: `${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`,
        urlEndpoint
      });

      // Test connection
      this.testConnection().then(success => {
        if (success) {
          console.log('✅ ImageKit connection verified successfully');
        } else {
          console.error('❌ ImageKit connection test failed - please check your credentials');
        }
      });
    } catch (error) {
      console.error('ImageKit initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async testConnection() {
    try {
      if (!this.isInitialized || !this.imagekit) {
        console.error('Cannot test connection - ImageKit not initialized');
        return false;
      }
      const response = await this.imagekit.listFiles({ limit: 1 });
      return true;
    } catch (error) {
      console.error('ImageKit connection test failed:', {
        message: error.message,
        help: 'Please verify your ImageKit credentials in .env.local file'
      });
      return false;
    }
  }

  async uploadImage(imageData, fileName) {
    if (!this.isInitialized || !this.imagekit) {
      throw new Error('ImageKit is not properly initialized. Please check your .env.local configuration.');
    }

    try {
      // Handle both base64 and data URL formats
      let file = imageData;
      if (!imageData.startsWith('data:')) {
        file = `data:image/jpeg;base64,${imageData}`;
      }

      // Validate the data URL format
      if (!file.match(/^data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)$/)) {
        throw new Error('Invalid image data format');
      }

      console.log(`Uploading image: ${fileName}`);
      const response = await this.imagekit.upload({
        file,
        fileName,
        useUniqueFileName: true
      });

      if (!response?.url) {
        throw new Error('ImageKit upload succeeded but no URL was returned');
      }

      console.log(`Image uploaded successfully: ${fileName}`);
      return response.url;
    } catch (error) {
      console.error('Image upload failed:', {
        error: error.message,
        fileName
      });
      throw error;
    }
  }

  isReady() {
    if (!this.isInitialized || !this.imagekit) {
      console.warn('ImageKit is not ready. Missing configuration in .env.local file.');
      return false;
    }
    return true;
  }
}

// Create and export a singleton instance
const imagekitService = new ImageKitService();
export default imagekitService;