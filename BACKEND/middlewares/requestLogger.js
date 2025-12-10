module.exports = {
    info: (message, meta) => {
        if (meta) {
            console.log(`[INFO] ${message}`, meta);
        } else {
            console.log(`[INFO] ${message}`);
        }
    },
    error: (message, meta) => {
        if (meta) {
            console.error(`[ERROR] ${message}`, meta);
        } else {
            console.error(`[ERROR] ${message}`);
        }
    }
};
