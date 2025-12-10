const { ObjectId } = require('mongodb');
const { getDB } = require('../../config/database');
const { sendProfileUpdatedEmail } = require('../../services/emailService');

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

        const userResponse = {
            id: user._id,
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            number: user.number,
            roles: user.roles,
            role_names: user.role_names,
            address: user.address,
            distributor: user.distributor,
            local_distributor: user.local_distributor,
            created_at: user.created_at,
            modified_at: user.modified_at,
            status: user.status
        };

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: userResponse
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

        const userResponse = {
            id: updatedUser._id,
            user_id: updatedUser.user_id,
            name: updatedUser.name,
            email: updatedUser.email,
            number: updatedUser.number,
            roles: updatedUser.roles,
            role_names: updatedUser.role_names,
            address: updatedUser.address,
            distributor: updatedUser.distributor,
            local_distributor: updatedUser.local_distributor,
            created_at: updatedUser.created_at,
            modified_at: updatedUser.modified_at,
            status: updatedUser.status
        };

        sendProfileUpdatedEmail(updatedUser, updateData);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Updating profile failed:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
