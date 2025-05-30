import express from 'express';
import imagekit, { getAuthenticationParameters } from '../config/imagekit.js';

const router = express.Router();

// Authentication endpoint
router.get('/auth', (req, res) => {
    try {
        const authParams = getAuthenticationParameters();
        res.json(authParams);
    } catch (error) {
        console.error('ImageKit auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Upload endpoint
router.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const file = req.files.image;
        const result = await imagekit.upload({
            file: file.data,
            fileName: `face_${Date.now()}`,
            folder: "/attendance-system"
        });

        res.json({
            success: true,
            imageUrl: result.url,
            fileId: result.fileId
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router; 