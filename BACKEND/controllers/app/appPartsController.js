const { getDB } = require('../../config/database');

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

module.exports = {
    getParts
};
