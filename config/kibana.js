module.exports = {
    enabled: true,
    index: 'logstash',
    type: 'metric',
    process: 'metrics-dispatcher',
    client: {
        host: 'localhost:9200',
        apiVersion: '5.0',
        log: false
    },
    mappings: {
        kibana: {
            series: {
                retain: [30, 'd']
            },
            mappings: {
                _default_: {
                    _all: {enabled: true, omit_norms: true},
                    dynamic_templates: [{
                        string_fields: {
                            mapping: {
                                fielddata: {format: 'disabled'},
                                index: 'analyzed',
                                omit_norms: true,
                                type: 'string',
                                fields: {
                                    raw: {
                                        ignore_above: 256,
                                        index: 'not_analyzed',
                                        type: 'string',
                                        doc_values: true
                                    }
                                }
                            },
                            match: '*',
                            match_mapping_type: 'string'
                        }
                    }, {
                        float_fields: {
                            mapping: {type: 'float', doc_values: true},
                            match: '*',
                            match_mapping_type: 'float'
                        }
                    }, {
                        double_fields: {
                            mapping: {type: 'double', doc_values: true},
                            match: '*',
                            match_mapping_type: 'double'
                        }
                    }, {
                        byte_fields: {
                            mapping: {type: 'byte', doc_values: true},
                            match: '*',
                            match_mapping_type: 'byte'
                        }
                    }, {
                        short_fields: {
                            mapping: {type: 'short', doc_values: true},
                            match: '*',
                            match_mapping_type: 'short'
                        }
                    }, {
                        integer_fields: {
                            mapping: {type: 'integer', doc_values: true},
                            match: '*',
                            match_mapping_type: 'integer'
                        }
                    }, {
                        long_fields: {
                            mapping: {type: 'long', doc_values: true},
                            match: '*',
                            match_mapping_type: 'long'
                        }
                    }, {
                        date_fields: {
                            mapping: {type: 'date', doc_values: true},
                            match: '*',
                            match_mapping_type: 'date'
                        }
                    }, {
                        geo_point_fields: {
                            mapping: {type: 'geo_point', doc_values: true},
                            match: '*',
                            match_mapping_type: 'geo_point'
                        }
                    }],
                    properties: {
                        '@timestamp': {type: 'date', format: 'strict_date_optional_time||epoch_millis'},
                        '@version': {type: 'string', index: 'not_analyzed'},
                        geoip: {
                            properties: {
                                latitude: {type: 'float'},
                                location: {type: 'geo_point'},
                                longitude: {type: 'float'}
                            }
                        }
                    }
                }
            }
        }
    }
};
