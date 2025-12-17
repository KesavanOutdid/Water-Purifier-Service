const { getDB } = require('../config/database');
const { reassignTask, sendReassignmentWarning, autoAssignTask } = require('../services/autoAssignService');
const { clearCache } = require('../middleware/cache');
const logger = require('../config/logger');

const ACCEPTANCE_TIMEOUT_MINUTES = 45;
const WARNING_1_MINUTES = 30;
const WARNING_2_MINUTES = 40;

const COMPLETION_TIMEOUT_HOURS = 48;
const COMPLETION_WARNING_1_HOURS = 36;
const COMPLETION_WARNING_2_HOURS = 44;

const REJECTED_TASK_RETRY_MINUTES = 15;

const checkAcceptanceTimeout = async () => {
    try {
        const db = getDB();
        const now = new Date();
        
        const timeoutThreshold = new Date(now.getTime() - ACCEPTANCE_TIMEOUT_MINUTES * 60 * 1000);
        const warning1Threshold = new Date(now.getTime() - WARNING_1_MINUTES * 60 * 1000);
        const warning2Threshold = new Date(now.getTime() - WARNING_2_MINUTES * 60 * 1000);

        const tasksNeedingReassignment = await db.collection('tasks').find({
            task_status: 'assigned',
            status: true,
            waiting: { $ne: true },
            assigned_time: { $lte: timeoutThreshold }
        }).toArray();

        for (const task of tasksNeedingReassignment) {
            logger.warn(`[ACCEPTANCE-TIMEOUT] Task ${task.task_id} not accepted within 45 minutes. Reassigning...`);
            await reassignTask(
                task.task_id,
                `Not accepted within 45 minutes by ${task.engineer_name}`,
                task.assigned_to
            );
        }

        const tasksNeedingWarning1 = await db.collection('tasks').find({
            task_status: 'assigned',
            status: true,
            waiting: { $ne: true },
            assigned_time: { $lte: warning1Threshold, $gt: warning2Threshold },
            'warnings.acceptance_warning_1': { $ne: true }
        }).toArray();

        for (const task of tasksNeedingWarning1) {
            logger.info(`[ACCEPTANCE-WARNING-1] Sending first warning for task ${task.task_id}`);
            await sendReassignmentWarning(task.task_id, 1);
            await db.collection('tasks').updateOne(
                { task_id: task.task_id },
                { $set: { 'warnings.acceptance_warning_1': true } }
            );
        }
        
        if (tasksNeedingWarning1.length > 0) {
            await clearCache('tasks:*');
        }

        const tasksNeedingWarning2 = await db.collection('tasks').find({
            task_status: 'assigned',
            status: true,
            waiting: { $ne: true },
            assigned_time: { $lte: warning2Threshold, $gt: timeoutThreshold },
            'warnings.acceptance_warning_2': { $ne: true }
        }).toArray();

        for (const task of tasksNeedingWarning2) {
            logger.info(`[ACCEPTANCE-WARNING-2] Sending final warning for task ${task.task_id}`);
            await sendReassignmentWarning(task.task_id, 2);
            await db.collection('tasks').updateOne(
                { task_id: task.task_id },
                { $set: { 'warnings.acceptance_warning_2': true } }
            );
        }
        
        if (tasksNeedingWarning2.length > 0) {
            await clearCache('tasks:*');
        }

        if (tasksNeedingReassignment.length > 0 || tasksNeedingWarning1.length > 0 || tasksNeedingWarning2.length > 0) {
            logger.info(`[ACCEPTANCE-TIMEOUT] Processed ${tasksNeedingReassignment.length} reassignments, ${tasksNeedingWarning1.length} warning-1s, ${tasksNeedingWarning2.length} warning-2s`);
        }
    } catch (error) {
        logger.error('[ACCEPTANCE-TIMEOUT] Error checking acceptance timeout:', error);
    }
};

const checkCompletionTimeout = async () => {
    try {
        const db = getDB();
        const now = new Date();
        
        const timeoutThreshold = new Date(now.getTime() - COMPLETION_TIMEOUT_HOURS * 60 * 60 * 1000);
        const warning1Threshold = new Date(now.getTime() - COMPLETION_WARNING_1_HOURS * 60 * 60 * 1000);
        const warning2Threshold = new Date(now.getTime() - COMPLETION_WARNING_2_HOURS * 60 * 60 * 1000);

        const tasksNeedingReassignment = await db.collection('tasks').find({
            task_status: { $in: ['accepted', 'in_progress'] },
            status: true,
            waiting: { $ne: true },
            $or: [
                { assigned_time: { $lte: timeoutThreshold } },
                { 
                    task_history: {
                        $elemMatch: {
                            action: 'accept',
                            timestamp: { $lte: timeoutThreshold }
                        }
                    }
                }
            ]
        }).toArray();

        for (const task of tasksNeedingReassignment) {
            const acceptHistory = task.task_history?.find(h => h.action === 'accept');
            const acceptTime = acceptHistory?.timestamp || task.assigned_time;
            
            if (acceptTime && new Date(acceptTime) <= timeoutThreshold) {
                logger.warn(`[COMPLETION-TIMEOUT] Task ${task.task_id} not completed within 48 hours. Reassigning...`);
                await reassignTask(
                    task.task_id,
                    `Not completed within 48 hours by ${task.engineer_name}`,
                    task.assigned_to
                );
            }
        }

        const tasksNeedingWarning1 = await db.collection('tasks').find({
            task_status: { $in: ['accepted', 'in_progress'] },
            status: true,
            waiting: { $ne: true },
            'warnings.completion_warning_1': { $ne: true }
        }).toArray();

        for (const task of tasksNeedingWarning1) {
            const acceptHistory = task.task_history?.find(h => h.action === 'accept');
            const acceptTime = acceptHistory?.timestamp || task.assigned_time;
            
            if (acceptTime && new Date(acceptTime) <= warning1Threshold && new Date(acceptTime) > warning2Threshold) {
                logger.info(`[COMPLETION-WARNING-1] Sending first warning for task ${task.task_id}`);
                await sendReassignmentWarning(task.task_id, 1);
                await db.collection('tasks').updateOne(
                    { task_id: task.task_id },
                    { $set: { 'warnings.completion_warning_1': true } }
                );
            }
        }
        
        const completionWarning1Count = tasksNeedingWarning1.filter(task => {
            const acceptHistory = task.task_history?.find(h => h.action === 'accept');
            const acceptTime = acceptHistory?.timestamp || task.assigned_time;
            return acceptTime && new Date(acceptTime) <= warning1Threshold && new Date(acceptTime) > warning2Threshold;
        }).length;
        
        if (completionWarning1Count > 0) {
            await clearCache('tasks:*');
        }

        const tasksNeedingWarning2 = await db.collection('tasks').find({
            task_status: { $in: ['accepted', 'in_progress'] },
            status: true,
            waiting: { $ne: true },
            'warnings.completion_warning_2': { $ne: true }
        }).toArray();

        for (const task of tasksNeedingWarning2) {
            const acceptHistory = task.task_history?.find(h => h.action === 'accept');
            const acceptTime = acceptHistory?.timestamp || task.assigned_time;
            
            if (acceptTime && new Date(acceptTime) <= warning2Threshold && new Date(acceptTime) > timeoutThreshold) {
                logger.info(`[COMPLETION-WARNING-2] Sending final warning for task ${task.task_id}`);
                await sendReassignmentWarning(task.task_id, 2);
                await db.collection('tasks').updateOne(
                    { task_id: task.task_id },
                    { $set: { 'warnings.completion_warning_2': true } }
                );
            }
        }
        
        const completionWarning2Count = tasksNeedingWarning2.filter(task => {
            const acceptHistory = task.task_history?.find(h => h.action === 'accept');
            const acceptTime = acceptHistory?.timestamp || task.assigned_time;
            return acceptTime && new Date(acceptTime) <= warning2Threshold && new Date(acceptTime) > timeoutThreshold;
        }).length;
        
        if (completionWarning2Count > 0) {
            await clearCache('tasks:*');
        }

        if (tasksNeedingReassignment.length > 0 || tasksNeedingWarning1.length > 0 || tasksNeedingWarning2.length > 0) {
            logger.info(`[COMPLETION-TIMEOUT] Processed ${tasksNeedingReassignment.length} reassignments, ${tasksNeedingWarning1.length} warning-1s, ${tasksNeedingWarning2.length} warning-2s`);
        }
    } catch (error) {
        logger.error('[COMPLETION-TIMEOUT] Error checking completion timeout:', error);
    }
};

const retryRejectedTasks = async () => {
    try {
        const db = getDB();
        
        const rejectedTasks = await db.collection('tasks').find({
            task_status: 'rejected',
            status: true
        }).toArray();

        if (rejectedTasks.length === 0) {
            return;
        }

        logger.info(`[REJECTED-RETRY] Found ${rejectedTasks.length} rejected tasks to retry`);

        for (const task of rejectedTasks) {
            const lastRejectionHistory = task.task_history
                ?.filter(h => h.action === 'reject')
                ?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            const excludeEngineers = lastRejectionHistory ? [lastRejectionHistory.engineer_id] : [];

            const result = await reassignTask(
                task.task_id,
                'Auto-retry after rejection - new engineers available',
                excludeEngineers.length > 0 ? excludeEngineers[0] : null
            );

            if (result.success) {
                logger.info(`[REJECTED-RETRY] Successfully reassigned task ${task.task_id}`);
            }
        }

    } catch (error) {
        logger.error('[REJECTED-RETRY] Error retrying rejected tasks:', error);
    }
};

const retryUnassignedTasks = async () => {
    try {
        const db = getDB();
        
        const unassignedTasks = await db.collection('tasks').find({
            task_status: 'created',
            status: true,
            local_distributor_id: { $exists: true, $ne: null }
        }).toArray();

        if (unassignedTasks.length === 0) {
            return;
        }

        logger.info(`[UNASSIGNED-RETRY] Found ${unassignedTasks.length} unassigned tasks to retry`);

        for (const task of unassignedTasks) {
            const result = await autoAssignTask(task.task_id);

            if (result.success) {
                logger.info(`[UNASSIGNED-RETRY] Successfully assigned task ${task.task_id}`);
            }
        }

    } catch (error) {
        logger.error('[UNASSIGNED-RETRY] Error retrying unassigned tasks:', error);
    }
};

const startTaskMonitor = () => {
    logger.info('[TASK-MONITOR] Starting task monitor jobs...');
    
    const CHECK_INTERVAL = 1 * 60 * 1000;
    
    checkAcceptanceTimeout();
    setInterval(checkAcceptanceTimeout, CHECK_INTERVAL);
    
    checkCompletionTimeout();
    setInterval(checkCompletionTimeout, CHECK_INTERVAL);
    
    retryRejectedTasks();
    setInterval(retryRejectedTasks, CHECK_INTERVAL);
    
    retryUnassignedTasks();
    setInterval(retryUnassignedTasks, CHECK_INTERVAL);
    
    logger.info('[TASK-MONITOR] Task monitor jobs started successfully');
    logger.info('[TASK-MONITOR] - All jobs running every 1 minute');
    logger.info('[TASK-MONITOR]   • Acceptance timeout check');
    logger.info('[TASK-MONITOR]   • Completion timeout check');
    logger.info('[TASK-MONITOR]   • Rejected tasks retry');
    logger.info('[TASK-MONITOR]   • Unassigned tasks retry');
};

module.exports = {
    startTaskMonitor,
    checkAcceptanceTimeout,
    checkCompletionTimeout,
    retryRejectedTasks,
    retryUnassignedTasks
};
