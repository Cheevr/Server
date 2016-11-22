const rateLimit = require('express-rate-limit');


let shutdownTimer = process.env.NODE_SHUTDOWN_TIMER || 10;
let shutdown = false;

module.exports = app => {
    // Health check that will gracefully signal shutdown
    app.get('/health', rateLimit({windowMs: 2500}), (req, res) => {
        if (!req.es.ready || shutdown) {
            return res.status(503).end();
        }
        req.es.ping(err => {
            if (err) {
                return res.status(503).end();
            }
            res.end();
        });
    });

    // Shutdown handler for graceful termination with delay for drain
    process.on('SIGTERM', () => {
        app.emit('shutdown');
        console.log('SIGTERM: Shutting down in', shutdownTimer, 'seconds!');
        shutdown = true;
        setInterval(() => console.log(--shutdownTimer), 1001);
        setTimeout(process.exit, shutdownTimer * 999, 0);
    });
};