const { ObjectId } = require('mongodb');
const { getDB } = require('../../config/database');
const { sendProfileUpdatedEmail } = require('../../services/emailService');
const path = require('path');
const fs = require('fs');
const { clearCache } = require('../../middleware/cache');
const logger = require('../../config/logger');

const getProfile = async (req, res) => {
    try {
        const { user_id } = req;

        if (!user_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ 
            user_id,
            status: true 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: user
        });
    } catch (error) {
        logger.error('Fetching profile failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { user_id, userEmail } = req;
        const { name, number, password, address } = req.body;

        if (!user_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ 
            user_id,
            status: true 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const updateData = {
            modified_by: userEmail || user_id,
            modified_at: new Date()
        };

        if (name && name.trim()) {
            updateData.name = name.trim();
        }

        if (number !== undefined) {
            updateData.number = number ? number.trim() : null;
        }

        if (password && password.trim()) {
            updateData.password = password.trim();
        }

        if (address) {
            updateData.address = {
                doorno: address.doorno || null,
                street: address.street || null,
                city: address.city || null,
                district: address.district || null,
                state: address.state || null,
                country: address.country || null,
                pincode: address.pincode || null
            };
        }

        await db.collection('users').updateOne(
            { user_id },
            { $set: updateData }
        );

        const updatedUser = await db.collection('users').findOne({ user_id });

        sendProfileUpdatedEmail(updatedUser, updateData);

        await clearCache('users:*');

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        logger.error('Updating profile failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

const uploadProfilePicture = async (req, res) => {
    try {
        const { user_id } = req;

        if (!user_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Profile picture file is required' 
            });
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ 
            user_id,
            status: true 
        });

        if (!user) {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const currentFileExt = path.extname(req.file.path).toLowerCase();
        const profilePicsDir = path.join(__dirname, '../../uploads/profile-pics');
        const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.heic', '.heif'];
        
        for (const ext of extensions) {
            if (ext !== currentFileExt) {
                const oldFilePath = path.join(profilePicsDir, `${user_id}${ext}`);
                if (fs.existsSync(oldFilePath)) {
                    try {
                        fs.unlinkSync(oldFilePath);
                    } catch (err) {
                        logger.error('Failed to delete old profile picture:', err);
                    }
                }
            }
        }

        let profilePicPath = req.file.path.replace(/\\/g, '/');
        
        if (path.isAbsolute(profilePicPath)) {
            const backendDir = path.resolve(__dirname, '../../');
            profilePicPath = path.relative(backendDir, req.file.path).replace(/\\/g, '/');
        }
        
        logger.info('File uploaded:', { 
            originalPath: req.file.path, 
            storedPath: profilePicPath, 
            fileExists: fs.existsSync(req.file.path) 
        });

        await db.collection('users').updateOne(
            { user_id },
            { 
                $set: {
                    profile_pic: profilePicPath,
                    modified_by: user.email || user_id,
                    modified_at: new Date()
                }
            }
        );

        await clearCache('users:*');

        return res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                profile_pic: profilePicPath
            }
        });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        logger.error('Uploading profile picture failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

const getProfilePicture = async (req, res) => {
    try {
        const { user_id } = req;

        if (!user_id) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ 
            user_id,
            status: true 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (!user.profile_pic) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile picture not found' 
            });
        }

        let filePath = path.join(__dirname, '../../', user.profile_pic);
        let absolutePath = path.resolve(filePath);
        
        if (!fs.existsSync(absolutePath)) {
            const profilePicsDir = path.join(__dirname, '../../uploads/profile-pics');
            const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.heic', '.heif'];
            let found = false;
            
            for (const ext of extensions) {
                const testPath = path.join(profilePicsDir, `${user_id}${ext}`);
                if (fs.existsSync(testPath)) {
                    absolutePath = testPath;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                logger.error(`Profile picture not found for user: ${user_id}`);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Profile picture file not found'
                });
            }
        }

        res.sendFile(absolutePath);
    } catch (error) {
        logger.error('Fetching profile picture failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    getProfilePicture
};
