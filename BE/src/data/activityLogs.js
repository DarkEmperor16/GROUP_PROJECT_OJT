const activityLogs = [];

function addActivityLog({ userId = null, action, result, ipAddress = null }) {
    const log = {
        id: activityLogs.length + 1,
        userId,
        action,
        entityType: 'AUTH',
        entityId: userId,
        result,
        timestamp: new Date().toISOString(),
        ipAddress,
    };

    activityLogs.push(log);
    return log;
}

module.exports = {
    activityLogs,
    addActivityLog,
};