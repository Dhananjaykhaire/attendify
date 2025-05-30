import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

class ImageKitService {
  constructor() {
    this.imagekit = null;
    this.initialize();
  }

  initialize() {
    try {
      const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

      if (!publicKey || !privateKey || !urlEndpoint) {
        console.error('ImageKit configuration is incomplete. Please check your .env.local file');
        return;
      }

      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint
      });

      console.log('✅ ImageKit service initialized successfully');
    } catch (error) {
      console.error('Error initializing ImageKit:', error);
    }
  }

  async upload(options) {
    if (!this.imagekit) {
      throw new Error('ImageKit is not initialized');
    }
    return await this.imagekit.upload(options);
  }

  async delete(fileId) {
    if (!this.imagekit) {
      throw new Error('ImageKit is not initialized');
    }
    return await this.imagekit.deleteFile(fileId);
  }

  getAuthenticationParameters() {
    if (!this.imagekit) {
      throw new Error('ImageKit is not initialized');
    }
    return this.imagekit.getAuthenticationParameters();
  }
}

// Create and export a singleton instance
const imagekitService = new ImageKitService();
export default imagekitService; 