const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../../config/database');
const { sendLoginEmail, sendProfileUpdatedEmail } = require('../../services/emailService');
const { clearCache } = require('../../middleware/cache');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const db = getDB();
        const admin = await db.collection('users').findOne({ email: normalizedEmail });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (admin.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (admin.status !== true) {
            return res.status(403).json({ success: false, message: 'Account is deactivated' });
        }

        const token = jwt.sign({ 
            id: admin._id.toString(), 
            roles: admin.roles || [], 
            user_id: admin.user_id || null, 
            email: admin.email 
        }, JWT_SECRET, { expiresIn: '1d' });

        sendLoginEmail(admin);

        const userData = {
            id: admin._id,
            user_id: admin.user_id,
            name: admin.name,
            email: admin.email,
            roles: admin.roles,
            role_names: admin.role_names,
            number: admin.number,
            created_at: admin.created_at,
            modified_at: admin.modified_at,
        };

        if (admin.distributor) {
            userData.distributor = admin.distributor;
            userData.distributor_name = admin.distributor_name;
        }

        if (admin.local_distributor) {
            userData.local_distributor = admin.local_distributor;
            userData.local_distributor_name = admin.local_distributor_name;
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userData,
            },
        });
    } catch (error) {
        console.error('Admin login failed:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const { user_id } = req;
        const { profileId } = req.query;

        if (!user_id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const db = getDB();

        if (!profileId) {
            return res.status(400).json({ success: false, message: 'Profile ID is required' });
        }

        const admin = await db.collection('users').findOne({ user_id: profileId });

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: admin,
        });
    } catch (error) {
        console.error('Fetching admin profile failed:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userObjectId, userEmail } = req;
        const { name, number, email, status, password } = req.body;

        if (!userObjectId) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const db = getDB();
        const admin = await db.collection('users').findOne({ _id: new ObjectId(userObjectId) });

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const updateData = {
            modified_by: userEmail,
            modified_at: new Date(),
        };

        if (name && name.trim()) {
            updateData.name = name.trim();
        }

        if (number !== undefined) {
            updateData.number = number ? number.trim() : null;
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        if (password && password.trim()) {
            updateData.password = password.trim();
        }

        if (email && email.trim() && email.trim().toLowerCase() !== admin.email) {
            return res.status(400).json({ success: false, message: 'Email cannot be updated' });
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(userObjectId) },
            { $set: updateData }
        );

        const updatedAdmin = await db.collection('users').findOne({ _id: new ObjectId(userObjectId) });

        const adminResponse = {
            ...updatedAdmin,
            password: undefined
        };

        sendProfileUpdatedEmail(updatedAdmin, updateData);

        await clearCache('users:*');

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: adminResponse,
        });
    } catch (error) {
        console.error('Updating profile failed:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    login,
    getProfile,
    updateProfile,
};
