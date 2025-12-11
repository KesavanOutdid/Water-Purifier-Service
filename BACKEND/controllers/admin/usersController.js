const { getDB } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendUserCreatedEmail, sendProfileUpdatedEmail } = require('../../services/emailService');

const getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const { user_id } = req.query;
        const db = getDB();

        let query = { status: true };

        if (user_id) {
            query = {
                status: true,
                $or: [
                    { distributor: user_id },
                    { local_distributor: user_id }
                ]
            };
        }

        const totalItems = await db.collection('users').countDocuments(query);
        req.paginationTotal = totalItems;

        const users = await db.collection('users')
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            number,
            password,
            roles,
            address,
            distributor,
            local_distributor,
            created_by
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'email is required'
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'password is required'
            });
        }

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'roles array is required and must contain at least one role_id'
            });
        }

        if (!created_by) {
            return res.status(400).json({
                success: false,
                message: 'created_by is required'
            });
        }

        const db = getDB();

        const existingUser = await db.collection('users').findOne({ 
            email: email.trim().toLowerCase() 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const roleRecords = await db.collection('roles').find({ 
            role_id: { $in: roles } 
        }).toArray();

        if (roleRecords.length !== roles.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more invalid role_ids'
            });
        }

        let distributor_name = null;
        let local_distributor_name = null;

        if (distributor) {
            const distributorUser = await db.collection('users').findOne({ 
                user_id: distributor, 
                status: true 
            });
            if (!distributorUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Distributor not found'
                });
            }
            distributor_name = distributorUser.name;
        }

        if (local_distributor) {
            const localDistributorUser = await db.collection('users').findOne({ 
                user_id: local_distributor, 
                status: true 
            });
            if (!localDistributorUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Local distributor not found'
                });
            }
            local_distributor_name = localDistributorUser.name;
        }

        const user_id = uuidv4();

        const newUser = {
            user_id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            number: number ? number.trim() : null,
            password: password.trim(),
            roles: roles,
            role_names: roleRecords.map(r => r.role_name),
            address: address ? {
                doorno: address.doorno || null,
                street: address.street || null,
                city: address.city || null,
                district: address.district || null,
                state: address.state || null,
                country: address.country || null,
                pincode: address.pincode || null
            } : null,
            distributor: distributor || null,
            distributor_name: distributor_name,
            local_distributor: local_distributor || null,
            local_distributor_name: local_distributor_name,
            created_by,
            created_at: new Date(),
            modified_by: null,
            modified_at: null,
            status: true
        };

        const result = await db.collection('users').insertOne(newUser);

        const userResponse = {
            ...newUser,
            password: undefined,
            _id: result.insertedId
        };

        sendUserCreatedEmail(newUser, created_by);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const {
            name,
            number,
            password,
            roles,
            address,
            distributor,
            local_distributor,
            modified_by,
            status
        } = req.body;

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const user = await db.collection('users').findOne({ user_id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updateData = {
            modified_by,
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

        if (roles && Array.isArray(roles) && roles.length > 0) {
            const roleRecords = await db.collection('roles').find({ 
                role_id: { $in: roles } 
            }).toArray();
            
            if (roleRecords.length !== roles.length) {
                return res.status(400).json({
                    success: false,
                    message: 'One or more invalid role_ids'
                });
            }
            updateData.roles = roles;
            updateData.role_names = roleRecords.map(r => r.role_name);
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

        if (distributor !== undefined) {
            if (distributor) {
                const distributorUser = await db.collection('users').findOne({ 
                    user_id: distributor, 
                    status: true 
                });
                if (!distributorUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'Distributor not found'
                    });
                }
                updateData.distributor = distributor;
                updateData.distributor_name = distributorUser.name;
            } else {
                updateData.distributor = null;
                updateData.distributor_name = null;
            }
        }

        if (local_distributor !== undefined) {
            if (local_distributor) {
                const localDistributorUser = await db.collection('users').findOne({ 
                    user_id: local_distributor, 
                    status: true 
                });
                if (!localDistributorUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'Local distributor not found'
                    });
                }
                updateData.local_distributor = local_distributor;
                updateData.local_distributor_name = localDistributorUser.name;
            } else {
                updateData.local_distributor = null;
                updateData.local_distributor_name = null;
            }
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        await db.collection('users').updateOne(
            { user_id },
            { $set: updateData }
        );

        const updatedUser = await db.collection('users').findOne({ user_id });
        if (updatedUser) {
            sendProfileUpdatedEmail(updatedUser, updateData);
        }

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { user_id } = req.params;

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

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        const db = getDB();

        const result = await db.collection('users').updateOne(
            { user_id },
            { $set: { status: false } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
