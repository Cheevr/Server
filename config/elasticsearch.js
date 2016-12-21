module.exports = {
    client: {
        host:'localhost:9200',
        log: 'info',
        apiVersion: '5.0'
    },
    mappings: {
        feedback: {
            series: {
                retain: [ 30, 'd' ]
            },
            mappings: {
                _default_: {
                    dynamic_templates: [{
                        string_fields: {
                            mapping: {
                                type: 'string',
                                analyzer: 'ngram_analyzer',
                                index: 'analyzed',
                                fields: {
                                    raw: {type: 'string', index: 'not_analyzed', ignore_above: 256}
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
                    }]
                },
                entry: {
                    properties: {
                        '@timestamp': {type: 'date', format: 'strict_date_optional_time||epoch_millis'},
                        '@version': {type: 'string', index: 'not_analyzed'},
                        screen: {type: 'string'},
                        name: {type: 'string'},
                        contact: {type: 'string'},
                        message: {type: 'string'},
                        agent: {type: 'string'},
                        platform: {type: 'string'},
                        href: {type: 'string'},
                        language: {type: 'string'},
                        tier: {type: 'string'},
                        application: {type: 'string'},
                        hostname: {type: 'string'},
                        process: {type: 'integer'},
                    }
                }
            },
            settings: {
                analysis: {
                    filter: {
                        ngram_filter: {
                            type: 'nGram',
                            min_gram: 2,
                            max_gram: 50
                        }
                    },
                    analyzer: {
                        ngram_analyzer: {
                            type: 'custom',
                            tokenizer: 'standard',
                            filter: ['lowercase', 'ngram_filter']
                        }
                    }
                },
                index: {
                    number_of_shards: 8,
                    search: {
                        slowlog: {
                            threshold: {
                                query: {
                                    warn: '10s',
                                    info: '5s',
                                    debug: '2s'
                                },
                                fetch: {
                                    warn: '1s',
                                    info: '800ms',
                                    debug: '500ms'
                                }
                            }
                        }
                    },
                    indexing: {
                        slowlog: {
                            threshold: {
                                index: {
                                    warn: '10s',
                                    info: '5s',
                                    debug: '2s'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
