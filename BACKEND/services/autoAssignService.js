const { getDB } = require('../config/database');
const { sendNotification } = require('../config/firebase');
const { clearCache } = require('../middleware/cache');
const logger = require('../config/logger');

const MAX_TASK_LOAD = 20;

const findAvailableEngineers = async (localDistributorId, excludeEngineers = []) => {
    const db = getDB();
    
    const engineers = await db.collection('users').find({
        status: true,
        roles: 4,
        local_distributor: localDistributorId
    }).toArray();

    const engineersWithLoad = await Promise.all(
        engineers.map(async (engineer) => {
            if (excludeEngineers.includes(engineer.user_id)) {
                return null;
            }

            const activeTasksCount = await db.collection('tasks').countDocuments({
                assigned_to: engineer.user_id,
                task_status: { $in: ['assigned', 'accepted', 'in_progress'] },
                status: true
            });

            return {
                ...engineer,
                activeTasksCount
            };
        })
    );

    return engineersWithLoad
        .filter(eng => eng !== null && eng.activeTasksCount < MAX_TASK_LOAD)
        .sort((a, b) => a.activeTasksCount - b.activeTasksCount);
};

const assignTaskToEngineer = async (taskId, engineerId, assignedBy, reason = 'auto_assignment') => {
    const db = getDB();

    const engineer = await db.collection('users').findOne({
        user_id: engineerId,
        status: true
    });

    if (!engineer) {
        throw new Error('Engineer not found');
    }

    const historyRecord = {
        action: 'assign',
        assigned_to: engineerId,
        assigned_by: assignedBy || 'system',
        engineer_name: engineer.name,
        timestamp: new Date(),
        reason: reason
    };

    await db.collection('tasks').updateOne(
        { task_id: taskId },
        {
            $set: {
                assigned_to: engineerId,
                engineer_name: engineer.name,
                assigned_by: assignedBy || 'system',
                assigned_time: new Date(),
                task_status: 'assigned',
                rejection_reason: null,
                waiting: false,
                waiting_reason: null,
                'warnings.acceptance_warning_1': false,
                'warnings.acceptance_warning_2': false,
                'warnings.completion_warning_1': false,
                'warnings.completion_warning_2': false,
                last_assignment_attempt: null,
                last_reassignment_attempt: null,
                modified_time: new Date()
            },
            $push: { task_history: historyRecord }
        }
    );

    await clearCache('tasks:*');

    const task = await db.collection('tasks').findOne({ task_id: taskId });
    
    const tokens = engineer.fcm_tokens?.map(t => t.token).filter(Boolean) || [];
    if (tokens.length > 0) {
        const { sendMultipleNotifications } = require('../config/firebase');
        const response = await sendMultipleNotifications(
            tokens,
            'New Task Assigned',
            `Task #${taskId} has been assigned to you - ${task?.customer_name || 'Customer'}`,
            {
                task_id: taskId.toString(),
                type: 'task_assigned',
                customer_name: task?.customer_name || '',
                service_type: task?.service_type?.toString() || ''
            }
        ).catch(err => logger.error('[AUTO-ASSIGN] Notification error:', err));

        if (response?.failureCount > 0) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && 
                    (resp.error?.code === 'messaging/invalid-registration-token' || 
                     resp.error?.code === 'messaging/registration-token-not-registered')) {
                    invalidTokens.push(tokens[idx]);
                }
            });

            if (invalidTokens.length > 0) {
                await db.collection('users').updateOne(
                    { user_id: engineerId },
                    { $pull: { fcm_tokens: { token: { $in: invalidTokens } } } }
                );
                logger.info(`[AUTO-ASSIGN] Removed ${invalidTokens.length} invalid tokens for engineer ${engineerId}`);
            }
        }
    } else if (engineer.fcm_token) {
        sendNotification(
            engineer.fcm_token,
            'New Task Assigned',
            `Task #${taskId} has been assigned to you - ${task?.customer_name || 'Customer'}`,
            {
                task_id: taskId.toString(),
                type: 'task_assigned',
                customer_name: task?.customer_name || '',
                service_type: task?.service_type?.toString() || ''
            }
        ).catch(err => logger.error('[AUTO-ASSIGN] Notification error:', err));
    }

    logger.info(`[AUTO-ASSIGN] Task ${taskId} assigned to engineer ${engineerId}`);
    return engineer;
};

const autoAssignTask = async (taskId) => {
    try {
        const db = getDB();

        const task = await db.collection('tasks').findOne({
            task_id: taskId,
            status: true
        });

        if (!task) {
            logger.error(`[AUTO-ASSIGN] Task ${taskId} not found`);
            return { success: false, message: 'Task not found' };
        }

        if (task.task_status !== 'created' && task.task_status !== 'rejected') {
            logger.info(`[AUTO-ASSIGN] Task ${taskId} status is ${task.task_status}, skipping auto-assignment`);
            return { success: false, message: 'Task is not in assignable status' };
        }

        if (!task.local_distributor_id) {
            logger.error(`[AUTO-ASSIGN] Task ${taskId} has no local distributor`);
            return { success: false, message: 'No local distributor assigned to task' };
        }

        const excludeEngineers = task.assigned_to ? [task.assigned_to] : [];
        const availableEngineers = await findAvailableEngineers(task.local_distributor_id, excludeEngineers);

        if (availableEngineers.length === 0) {
            const now = new Date();
            const lastAttempt = task.last_assignment_attempt ? new Date(task.last_assignment_attempt) : null;
            const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

            if (!lastAttempt || lastAttempt < oneMinuteAgo) {
                logger.warn(`[AUTO-ASSIGN] No available engineers for task ${taskId}`);
                
                await db.collection('tasks').updateOne(
                    { task_id: taskId },
                    {
                        $set: {
                            task_status: 'created',
                            assigned_to: null,
                            engineer_name: null,
                            rejection_reason: null,
                            last_assignment_attempt: now,
                            modified_time: new Date()
                        }
                    }
                );

                await clearCache('tasks:*');
            }

            return { success: false, message: 'No available engineers found' };
        }

        const selectedEngineer = availableEngineers[0];
        await assignTaskToEngineer(taskId, selectedEngineer.user_id, 'system', 'auto_assignment');

        return {
            success: true,
            message: 'Task auto-assigned successfully',
            engineer: selectedEngineer
        };
    } catch (error) {
        logger.error(`[AUTO-ASSIGN] Error assigning task ${taskId}:`, error);
        return { success: false, message: error.message };
    }
};

const reassignTask = async (taskId, reason, excludeEngineer = null) => {
    try {
        const db = getDB();

        const task = await db.collection('tasks').findOne({
            task_id: taskId,
            status: true
        });

        if (!task) {
            logger.error(`[REASSIGN] Task ${taskId} not found`);
            return { success: false, message: 'Task not found' };
        }

        if (task.waiting === true) {
            logger.info(`[REASSIGN] Task ${taskId} is in waiting status, skipping auto-reassignment`);
            return { success: false, message: 'Task is in waiting status, auto-reassignment disabled' };
        }

        if (!task.local_distributor_id) {
            logger.error(`[REASSIGN] Task ${taskId} has no local distributor`);
            return { success: false, message: 'No local distributor assigned to task' };
        }

        const excludeEngineers = excludeEngineer ? [excludeEngineer] : [];
        if (task.assigned_to && !excludeEngineers.includes(task.assigned_to)) {
            excludeEngineers.push(task.assigned_to);
        }

        const availableEngineers = await findAvailableEngineers(task.local_distributor_id, excludeEngineers);

        if (availableEngineers.length === 0) {
            const now = new Date();
            const lastAttempt = task.last_reassignment_attempt ? new Date(task.last_reassignment_attempt) : null;
            const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

            if (!lastAttempt || lastAttempt < oneMinuteAgo) {
                logger.warn(`[REASSIGN] No available engineers for task ${taskId} - ${reason}`);
                
                await db.collection('tasks').updateOne(
                    { task_id: taskId },
                    {
                        $set: {
                            last_reassignment_attempt: now
                        }
                    }
                );

                if (task.assigned_to) {
                    const engineer = await db.collection('users').findOne({ user_id: task.assigned_to });
                    if (engineer?.fcm_token) {
                        sendNotification(
                            engineer.fcm_token,
                            'Task Status Update',
                            `No engineers available for reassignment. Please complete Task #${taskId}.`,
                            {
                                task_id: taskId.toString(),
                                type: 'reassignment_failed',
                                reason: 'no_engineers_available'
                            }
                        ).catch(err => logger.error('[REASSIGN] Notification error:', err));
                    }
                }
            }

            return { success: false, message: 'No available engineers found for reassignment' };
        }

        const historyRecord = {
            action: 'reassign',
            previous_engineer: task.assigned_to,
            previous_engineer_name: task.engineer_name,
            assigned_to: availableEngineers[0].user_id,
            assigned_by: 'system',
            engineer_name: availableEngineers[0].name,
            timestamp: new Date(),
            reason: reason
        };

        await db.collection('tasks').updateOne(
            { task_id: taskId },
            {
                $set: {
                    assigned_to: availableEngineers[0].user_id,
                    engineer_name: availableEngineers[0].name,
                    assigned_by: 'system',
                    assigned_time: new Date(),
                    task_status: 'assigned',
                    rejection_reason: null,
                    waiting: false,
                    waiting_reason: null,
                    'warnings.acceptance_warning_1': false,
                    'warnings.acceptance_warning_2': false,
                    'warnings.completion_warning_1': false,
                    'warnings.completion_warning_2': false,
                    last_reassignment_attempt: null,
                    modified_time: new Date()
                },
                $push: { task_history: historyRecord }
            }
        );

        await clearCache('tasks:*');

        const newEngineer = availableEngineers[0];
        const tokens = newEngineer.fcm_tokens?.map(t => t.token).filter(Boolean) || [];
        
        if (tokens.length > 0) {
            const { sendMultipleNotifications } = require('../config/firebase');
            const response = await sendMultipleNotifications(
                tokens,
                'Task Reassigned to You',
                `Task #${taskId} has been reassigned to you - ${task.customer_name}`,
                {
                    task_id: taskId.toString(),
                    type: 'task_reassigned',
                    customer_name: task.customer_name,
                    service_type: task.service_type?.toString() || '',
                    reason: reason
                }
            ).catch(err => logger.error('[REASSIGN] Notification error:', err));

            if (response?.failureCount > 0) {
                const invalidTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success && 
                        (resp.error?.code === 'messaging/invalid-registration-token' || 
                         resp.error?.code === 'messaging/registration-token-not-registered')) {
                        invalidTokens.push(tokens[idx]);
                    }
                });

                if (invalidTokens.length > 0) {
                    await db.collection('users').updateOne(
                        { user_id: newEngineer.user_id },
                        { $pull: { fcm_tokens: { token: { $in: invalidTokens } } } }
                    );
                    logger.info(`[REASSIGN] Removed ${invalidTokens.length} invalid tokens for engineer ${newEngineer.user_id}`);
                }
            }
        } else if (newEngineer.fcm_token) {
            sendNotification(
                newEngineer.fcm_token,
                'Task Reassigned to You',
                `Task #${taskId} has been reassigned to you - ${task.customer_name}`,
                {
                    task_id: taskId.toString(),
                    type: 'task_reassigned',
                    customer_name: task.customer_name,
                    service_type: task.service_type?.toString() || '',
                    reason: reason
                }
            ).catch(err => logger.error('[REASSIGN] Notification error:', err));
        }

        logger.info(`[REASSIGN] Task ${taskId} reassigned from ${task.assigned_to} to ${newEngineer.user_id}. Reason: ${reason}`);

        return {
            success: true,
            message: 'Task reassigned successfully',
            engineer: availableEngineers[0],
            reason: reason
        };
    } catch (error) {
        logger.error(`[REASSIGN] Error reassigning task ${taskId}:`, error);
        return { success: false, message: error.message };
    }
};

const sendReassignmentWarning = async (taskId, warningNumber) => {
    try {
        const db = getDB();

        const task = await db.collection('tasks').findOne({
            task_id: taskId,
            status: true
        });

        if (!task || !task.assigned_to) {
            return;
        }

        const engineer = await db.collection('users').findOne({
            user_id: task.assigned_to,
            status: true
        });

        if (!engineer?.fcm_token) {
            return;
        }

        const warningMessage = warningNumber === 1
            ? `Task #${taskId} requires attention. Please accept or complete soon to avoid reassignment.`
            : `Final warning for Task #${taskId}. Task will be reassigned if not completed soon.`;

        sendNotification(
            engineer.fcm_token,
            `Task Warning #${warningNumber}`,
            warningMessage,
            {
                task_id: taskId.toString(),
                type: 'reassignment_warning',
                warning_number: warningNumber.toString()
            }
        ).catch(err => logger.error('[WARNING] Notification error:', err));

        logger.info(`[WARNING] Sent warning #${warningNumber} for task ${taskId} to engineer ${engineer.user_id}`);
    } catch (error) {
        logger.error(`[WARNING] Error sending warning for task ${taskId}:`, error);
    }
};

module.exports = {
    findAvailableEngineers,
    assignTaskToEngineer,
    autoAssignTask,
    reassignTask,
    sendReassignmentWarning
};
