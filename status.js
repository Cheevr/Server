var rateLimit = require('express-rate-limit');


var shutdown = false;
var shutdownTimer = process.env.NODE_SHUTDOWN_TIMER || 10;

module.exports = app => {
    // Health check that will gracefully signal shutdown
    app.get('/health', rateLimit({windowMs: 2500}), (req, res) => {
        if (shutdown) {
            return res.status(500).end();
        }
        res.end();
    });

    // Shutdown handler for graceful termination with delay for drain
    process.on('SIGTERM', () => {
        console.log('SIGTERM: Shutting down in', shutdownTimer, 'seconds!');
        shutdown = true;
        setInterval(() => console.log(--shutdownTimer), 1001);
        setTimeout(process.exit, shutdownTimer * 999, 0);
    });
};