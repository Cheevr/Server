module.exports = {
    es: {
        logger: 'elasticsearch',
        client: {
            host:'localhost:9200',
        },
        indices: {
            feedback: {
                series: {
                    retain: [ 30, 'd' ]
                },
                mappings: {
                    entry: {
                        properties: {
                            '@timestamp': {type: 'date', format: 'strict_date_optional_time||epoch_millis'},
                            '@version': {type: 'string', index: 'not_analyzed'},
                            screen: {type: 'keyword'},
                            name: {type: 'keyword'},
                            contact: {type: 'keyword'},
                            message: {type: 'text', analyzer: 'ngram_analyzer'},
                            agent: {type: 'keyword'},
                            platform: {type: 'keyword'},
                            href: {type: 'text'},
                            language: {type: 'keyword'},
                            tier: {type: 'keyword'},
                            application: {type: 'keyword'},
                            hostname: {type: 'keyword'},
                            process: {type: 'keyword'},
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
                        number_of_shards: 4,
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
    },
    tasks: {
        logger: 'tasks',
        client: {
            host:'localhost:9200',
        },
        indices: {
            tasks: {
                mappings: {
                    task: {
                        properties: {
                            host: {type: 'keyword'},
                            file: {type: 'text', analyzer: 'ngram_analyzer'},
                            workers: {type: 'short'},
                            enabled: {type: 'boolean'}
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
                        number_of_shards: 4,
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
    },
    kibana: {
        client: {
            host: 'localhost:9200'
        },
        indices: {
            logstash: {
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
                                    analyzer: 'ngram_analyzer',
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
                        number_of_shards: 4,
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
    }
};
