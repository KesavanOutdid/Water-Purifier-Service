const { getDB } = require('../../config/database');
const { clearCache } = require('../../middleware/cache');
const { v4: uuidv4 } = require('uuid');

const createPart = async (req, res) => {
    try {
        const { name, created_by } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        if (!created_by) {
            return res.status(400).json({
                success: false,
                message: 'created_by is required'
            });
        }

        const db = getDB();

        const existingPart = await db.collection('parts').findOne({
            name: name.trim(),
            status: true
        });

        if (existingPart) {
            return res.status(400).json({
                success: false,
                message: 'Part with this name already exists'
            });
        }

        const newPart = {
            part_id: uuidv4(),
            name: name.trim(),
            created_by,
            created_time: new Date(),
            modified_by: null,
            modified_time: null,
            status: true
        };

        const result = await db.collection('parts').insertOne(newPart);

        await clearCache('parts:*');

        res.status(201).json({
            success: true,
            message: 'Part created successfully',
            data: { ...newPart, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating part',
            error: error.message
        });
    }
};

const getParts = async (req, res) => {
    try {
        const db = getDB();

        const parts = await db.collection('parts')
            .find({ status: true })
            .sort({ created_time: -1 })
            .toArray();

        res.json({
            success: true,
            data: parts,
            count: parts.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching parts',
            error: error.message
        });
    }
};

const getPartById = async (req, res) => {
    try {
        const { part_id } = req.params;
        const db = getDB();

        const part = await db.collection('parts').findOne({
            part_id,
            status: true
        });

        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'Part not found'
            });
        }

        res.json({
            success: true,
            data: part
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching part',
            error: error.message
        });
    }
};

const updatePart = async (req, res) => {
    try {
        const { part_id } = req.params;
        const { name, modified_by } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required'
            });
        }

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const part = await db.collection('parts').findOne({
            part_id,
            status: true
        });

        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'Part not found'
            });
        }

        const existingPart = await db.collection('parts').findOne({
            name: name.trim(),
            part_id: { $ne: part_id },
            status: true
        });

        if (existingPart) {
            return res.status(400).json({
                success: false,
                message: 'Another part with this name already exists'
            });
        }

        await db.collection('parts').updateOne(
            { part_id },
            {
                $set: {
                    name: name.trim(),
                    modified_by,
                    modified_time: new Date()
                }
            }
        );

        await clearCache('parts:*');

        res.json({
            success: true,
            message: 'Part updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating part',
            error: error.message
        });
    }
};

const deletePart = async (req, res) => {
    try {
        const { part_id } = req.params;
        const { modified_by } = req.body;

        if (!modified_by) {
            return res.status(400).json({
                success: false,
                message: 'modified_by is required'
            });
        }

        const db = getDB();

        const part = await db.collection('parts').findOne({
            part_id,
            status: true
        });

        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'Part not found'
            });
        }

        await db.collection('parts').updateOne(
            { part_id },
            {
                $set: {
                    status: false,
                    modified_by,
                    modified_time: new Date()
                }
            }
        );

        await clearCache('parts:*');

        res.json({
            success: true,
            message: 'Part deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting part',
            error: error.message
        });
    }
};

module.exports = {
    createPart,
    getParts,
    getPartById,
    updatePart,
    deletePart
};
