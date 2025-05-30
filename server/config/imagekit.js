import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

let imagekit;

const initializeImageKit = () => {
    try {
        const config = {
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        };

        // Log configuration (without private key)
        console.log('ImageKit initialized with:', {
            publicKey: config.publicKey ? `"${config.publicKey.substring(0, 3)}...${config.publicKey.substring(config.publicKey.length - 2)}"` : undefined,
            urlEndpoint: config.urlEndpoint
        });

        imagekit = new ImageKit(config);
        console.log('✅ ImageKit initialized with configuration');

        // Test the connection
        testImageKitConnection();

        return imagekit;
    } catch (error) {
        console.error('⚠️ Error initializing ImageKit:', error.message);
        throw error;
    }
};

const testImageKitConnection = async () => {
    try {
        // Test authentication by trying to get authentication parameters
        const authParams = imagekit.getAuthenticationParameters();
        if (!authParams.token || !authParams.expire || !authParams.signature) {
            throw new Error('Invalid authentication parameters');
        }
        console.log('✅ ImageKit connection test successful');
    } catch (error) {
        console.error('ImageKit connection test failed:', {
            message: error.message,
            help: 'Please verify your ImageKit credentials in .env.local file'
        });
        console.log('❌ ImageKit connection test failed - please check your credentials');
    }
};

export const validateImageKitConfig = () => {
    const config = {
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    };

    let isValid = true;
    
    if (!config.privateKey) {
        console.error('⚠️ ImageKit private key is missing in environment variables');
        isValid = false;
    }
    if (!config.publicKey) {
        console.error('⚠️ ImageKit public key is missing in environment variables');
        isValid = false;
    }
    if (!config.urlEndpoint) {
        console.error('⚠️ ImageKit URL endpoint is missing in environment variables');
        isValid = false;
    }

    if (isValid) {
        console.log('✅ ImageKit configuration validated successfully');
    } else {
        console.log('⚠️ Please check your .env.local file in:', process.cwd());
    }

    return isValid;
};

export const uploadImage = async (file, fileName) => {
    if (!imagekit) {
        initializeImageKit();
    }
    
    try {
        const result = await imagekit.upload({
            file: file,
            fileName: fileName,
            folder: "/attendance-system"
        });
        return result;
    } catch (error) {
        console.error('ImageKit upload error:', error);
        throw error;
    }
};

export const getAuthenticationParameters = () => {
    if (!imagekit) {
        initializeImageKit();
    }
    return imagekit.getAuthenticationParameters();
};

// Initialize ImageKit when the module is loaded
initializeImageKit();

export default imagekit; 