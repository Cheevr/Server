module.exports = {
    type: 'memory',
    max: '1000',
    ttl: [ 1, 'h' ],
    stats: {
        interval: [ 1, 'm' ],
        /**
         * Sets the number of requests to the same key required to make into the keys list.
         * If set to something false, it will disabled key statistics
         */
        threshold: 10
    }
};