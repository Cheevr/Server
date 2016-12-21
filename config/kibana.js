module.exports = {
    enabled: true,
    index: 'logstash',
    type: 'metric',
    process: 'metrics-dispatcher',
    client: {
        host: 'localhost:9200',
        apiVersion: '5.0'
    }
};
