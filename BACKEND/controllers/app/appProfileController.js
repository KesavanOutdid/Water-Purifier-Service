const { ObjectId } = require('mongodb');
const { getDB } = require('../../config/database');
const { sendProfileUpdatedEmail } = require('../../services/emailService');
const path = require('path');
const fs = require('fs');

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
        console.error('Fetching profile failed:', error);
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

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Updating profile failed:', error);
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

        if (user.profile_pic) {
            const oldFilePath = path.resolve(__dirname, '../../', user.profile_pic);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        const profilePicPath = req.file.path.replace(/\\/g, '/');

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
        console.error('Uploading profile picture failed:', error);
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

        const filePath = path.resolve(__dirname, '../../', user.profile_pic);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile picture file not found' 
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('Fetching profile picture failed:', error);
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
