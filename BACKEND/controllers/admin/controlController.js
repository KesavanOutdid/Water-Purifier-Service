const { getDB } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { clearCache } = require('../../middleware/cache');

const getmodels = async (req, res) => {
    try {
        const { page, limit, skip } = req.pagination;
        const db = getDB();

        const totalItems = await db.collection('models').countDocuments({ status: true });
        req.paginationTotal = totalItems;

        const models = await db.collection('models')
            .find({ status: true })
            .sort({ created_time: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        res.json({
            success: true,
            data: models,
            total_count: totalItems
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching models',
            error: error.message
        });
    }
};

const getControlById = async (req, res) => {
    try {
        const { uid } = req.params;
        const db = getDB();

        const control = await db.collection('models').findOne({ uid, status: true });

        if (!control) {
            return res.status(404).json({
                success: false,
                message: 'Control not found'
            });
        }

        res.json({
            success: true,
            data: control
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching control',
            error: error.message
        });
    }
};

const createControl = async (req, res) => {
    try {
        const { name, quantity, created_by } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: 'quantity is required'
            });
        }

        if (!created_by) {
            return res.status(400).json({
                success: false,
                message: 'created_by is required'
            });
        }

        const db = getDB();

        const newControl = {
            uid: uuidv4(),
            name,
            quantity: Number(quantity),
            created_by,
            created_time: new Date(),
            modified_by: null,
            modified_time: null,
            status: true
        };

        const result = await db.collection('models').insertOne(newControl);

        await clearCache('models:*');

        res.status(201).json({
            success: true,
            message: 'Control created successfully',
            data: { ...newControl, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating control',
            error: error.message
        });
    }
};

const updateControl = async (req, res) => {
    try {
        const { uid } = req.params;
        const { name, quantity, modified_by } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: 'quantity is required'
            });
        }

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const updateData = {
            name,
            quantity: Number(quantity),
            modified_by,
            modified_time: new Date()
        };

        const result = await db.collection('models').updateOne(
            { uid, status: true },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Control not found'
            });
        }

        await clearCache('models:*');

        res.json({
            success: true,
            message: 'Control updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating control',
            error: error.message
        });
    }
};

const deleteControl = async (req, res) => {
    try {
        const { uid } = req.params;

        const db = getDB();

        const result = await db.collection('models').updateOne(
            { uid, status: true },
            { $set: { status: false } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Control not found'
            });
        }

        await clearCache('models:*');

        res.json({
            success: true,
            message: 'Control deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting control',
            error: error.message
        });
    }
};

module.exports = {
    getmodels,
    getControlById,
    createControl,
    updateControl,
    deleteControl
};
