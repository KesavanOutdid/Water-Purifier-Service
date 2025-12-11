const { getDB } = require('../../config/database');

const assignDevice = async (req, res) => {
    try {
        const { device_id } = req.params;
        const { distributor_id, local_distributor_id, assigned_by, level } = req.body;

        if (!assigned_by) {
            return res.status(400).json({
                success: false,
                message: 'assigned_by is required'
            });
        }

        if (!level || !['distributor', 'local_distributor'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'level is required and must be either "distributor" or "local_distributor"'
            });
        }

        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id, 
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        if (level === 'distributor') {
            if (!distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'distributor_id is required for distributor level assignment'
                });
            }

            if (device.assigned_to) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is already assigned to a distributor'
                });
            }

            const distributor = await db.collection('users').findOne({ 
                user_id: distributor_id, 
                status: true 
            });

            if (!distributor) {
                return res.status(404).json({
                    success: false,
                    message: 'Distributor not found'
                });
            }

            const assignmentRecord = {
                action: 'assign',
                from: null,
                to: distributor_id,
                to_name: distributor.name,
                assigned_by,
                timestamp: new Date(),
                level: 'distributor'
            };

            await db.collection('devices').updateOne(
                { device_id: device_id },
                { 
                    $set: {
                        assigned_to: distributor_id,
                        distributor_name: distributor.name,
                        assigned_by,
                        assigned_time: new Date(),
                        modified_by: assigned_by,
                        modified_time: new Date()
                    },
                    $push: { assignment_history: assignmentRecord }
                }
            );

            res.json({
                success: true,
                message: 'Device assigned to distributor successfully'
            });

        } else if (level === 'local_distributor') {
            if (!local_distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'local_distributor_id is required for local distributor level assignment'
                });
            }

            if (!device.assigned_to) {
                return res.status(400).json({
                    success: false,
                    message: 'Device must be assigned to a distributor first'
                });
            }

            if (device.assigned_to_local) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is already assigned to a local distributor'
                });
            }

            const localDistributor = await db.collection('users').findOne({ 
                user_id: local_distributor_id, 
                status: true 
            });

            if (!localDistributor) {
                return res.status(404).json({
                    success: false,
                    message: 'Local distributor not found'
                });
            }

            const assignmentRecord = {
                action: 'assign',
                from: null,
                to: local_distributor_id,
                to_name: localDistributor.name,
                assigned_by,
                timestamp: new Date(),
                level: 'local_distributor'
            };

            await db.collection('devices').updateOne(
                { device_id: device_id },
                { 
                    $set: {
                        assigned_to_local: local_distributor_id,
                        local_distributor_name: localDistributor.name,
                        assigned_by,
                        assigned_time: new Date(),
                        modified_by: assigned_by,
                        modified_time: new Date()
                    },
                    $push: { assignment_history: assignmentRecord }
                }
            );

            res.json({
                success: true,
                message: 'Device assigned to local distributor successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning device',
            error: error.message
        });
    }
};

const unassignDevice = async (req, res) => {
    try {
        const { device_id } = req.params;
        const { assigned_by, level } = req.body;

        if (!assigned_by) {
            return res.status(400).json({
                success: false,
                message: 'assigned_by is required'
            });
        }

        if (!level || !['distributor', 'local_distributor'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'level is required and must be either "distributor" or "local_distributor"'
            });
        }

        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id, 
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        let updateData = {
            modified_by: assigned_by,
            modified_time: new Date()
        };

        let assignmentRecord;

        if (level === 'distributor') {
            if (!device.assigned_to) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is not assigned to any distributor'
                });
            }

            assignmentRecord = {
                action: 'unassign',
                from: device.assigned_to,
                from_name: device.distributor_name,
                to: null,
                assigned_by,
                timestamp: new Date(),
                level: 'distributor'
            };

            updateData.assigned_to = null;
            updateData.distributor_name = null;
            updateData.assigned_by = null;
            updateData.assigned_time = null;
            updateData.assigned_to_local = null;
            updateData.local_distributor_name = null;

        } else if (level === 'local_distributor') {
            if (!device.assigned_to_local) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is not assigned to any local distributor'
                });
            }

            assignmentRecord = {
                action: 'unassign',
                from: device.assigned_to_local,
                from_name: device.local_distributor_name,
                to: null,
                assigned_by,
                timestamp: new Date(),
                level: 'local_distributor'
            };

            updateData.assigned_to_local = null;
            updateData.local_distributor_name = null;
        }

        await db.collection('devices').updateOne(
            { device_id: device_id },
            { 
                $set: updateData,
                $push: { assignment_history: assignmentRecord }
            }
        );

        res.json({
            success: true,
            message: `Device unassigned from ${level} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unassigning device',
            error: error.message
        });
    }
};

const reassignDevice = async (req, res) => {
    try {
        const { device_id } = req.params;
        const { new_distributor_id, new_local_distributor_id, assigned_by, level } = req.body;

        if (!assigned_by) {
            return res.status(400).json({
                success: false,
                message: 'assigned_by is required'
            });
        }

        if (!level || !['distributor', 'local_distributor'].includes(level)) {
            return res.status(400).json({
                success: false,
                message: 'level is required and must be either "distributor" or "local_distributor"'
            });
        }

        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id, 
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        if (level === 'distributor') {
            if (!new_distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'new_distributor_id is required for distributor level reassignment'
                });
            }

            if (!device.assigned_to) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is not currently assigned to any distributor'
                });
            }

            if (device.assigned_to === new_distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is already assigned to this distributor'
                });
            }

            const newDistributor = await db.collection('users').findOne({ 
                user_id: new_distributor_id, 
                status: true 
            });

            if (!newDistributor) {
                return res.status(404).json({
                    success: false,
                    message: 'New distributor not found'
                });
            }

            const assignmentRecord = {
                action: 'reassign',
                from: device.assigned_to,
                from_name: device.distributor_name,
                to: new_distributor_id,
                to_name: newDistributor.name,
                assigned_by,
                timestamp: new Date(),
                level: 'distributor'
            };

            await db.collection('devices').updateOne(
                { device_id: device_id },
                { 
                    $set: {
                        assigned_to: new_distributor_id,
                        distributor_name: newDistributor.name,
                        assigned_by,
                        assigned_time: new Date(),
                        assigned_to_local: null,
                        local_distributor_name: null,
                        modified_by: assigned_by,
                        modified_time: new Date()
                    },
                    $push: { assignment_history: assignmentRecord }
                }
            );

            res.json({
                success: true,
                message: 'Device reassigned to new distributor successfully'
            });

        } else if (level === 'local_distributor') {
            if (!new_local_distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'new_local_distributor_id is required for local distributor level reassignment'
                });
            }

            if (!device.assigned_to) {
                return res.status(400).json({
                    success: false,
                    message: 'Device must be assigned to a distributor first'
                });
            }

            if (!device.assigned_to_local) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is not currently assigned to any local distributor'
                });
            }

            if (device.assigned_to_local === new_local_distributor_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Device is already assigned to this local distributor'
                });
            }

            const newLocalDistributor = await db.collection('users').findOne({ 
                user_id: new_local_distributor_id, 
                status: true 
            });

            if (!newLocalDistributor) {
                return res.status(404).json({
                    success: false,
                    message: 'New local distributor not found'
                });
            }

            const assignmentRecord = {
                action: 'reassign',
                from: device.assigned_to_local,
                from_name: device.local_distributor_name,
                to: new_local_distributor_id,
                to_name: newLocalDistributor.name,
                assigned_by,
                timestamp: new Date(),
                level: 'local_distributor'
            };

            await db.collection('devices').updateOne(
                { device_id: device_id },
                { 
                    $set: {
                        assigned_to_local: new_local_distributor_id,
                        local_distributor_name: newLocalDistributor.name,
                        assigned_by,
                        assigned_time: new Date(),
                        modified_by: assigned_by,
                        modified_time: new Date()
                    },
                    $push: { assignment_history: assignmentRecord }
                }
            );

            res.json({
                success: true,
                message: 'Device reassigned to new local distributor successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reassigning device',
            error: error.message
        });
    }
};

const getAssignmentHistory = async (req, res) => {
    try {
        const { device_id } = req.params;
        const db = getDB();

        const device = await db.collection('devices').findOne({ 
            device_id: device_id, 
            status: true 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.json({
            success: true,
            data: {
                device_id: device.device_id,
                current_assignment: {
                    distributor: device.assigned_to,
                    local_distributor: device.assigned_to_local
                },
                assignment_history: device.assignment_history || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignment history',
            error: error.message
        });
    }
};

module.exports = {
    assignDevice,
    unassignDevice,
    reassignDevice,
    getAssignmentHistory
};
