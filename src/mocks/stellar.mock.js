require('dotenv').config()
const Stellar = require('stellar-sdk');

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

/**
 * Handle addition of duplicate ID
 */
let duplicate = 
[
    {
        id: "e9623c4d920b8c0705ac35d0727a39b05a0bfa802833f31a65f33bd28952f0a4",
        created_at: new Date(1537962651).valueOf(),
        _attributes: {
            tx: {
                _attributes: {
                    sourceAccount: {
                        _value: 'GDUZ7SJD7MGHZLJPOYCVRCYFIZ47J2ESGXA44X5LSUGGT3FV5FEGD7D2'
                    },
                    operations: [
                        {
                            _attributes: {
                                body: {
                                    _armType: {
                                        structName: 'PaymentOp'
                                    },
                                    _value: {
                                        _attributes: {
                                            asset: {
                                                _switch: {
                                                    name: 'assetTypeNative'
                                                }
                                            },
                                            amount: {
                                                low: 70000000
                                            },
                                            destination: {
                                                _value: process.env.STELLAR_SRC_ACC
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
]

/**
 * Handle addition of wrong operation for transaction
 */
let operation = 
[
    {
        id: "e9623c4d920b8c0705ac35d0727a39b05a0bfa802833f31a65f33bd28952f0a4",
        created_at: new Date(1537962651).valueOf(),
        _attributes: {
            tx: {
                _attributes: {
                    sourceAccount: {
                        _value: 'GDUZ7SJD7MGHZLJPOYCVRCYFIZ47J2ESGXA44X5LSUGGT3FV5FEGD7D2'
                    },
                    operations: [
                        {
                            _attributes: {
                                body: {
                                    _armType: {
                                        structName: 'AccountCreated'
                                    },
                                    _value: {
                                        _attributes: {
                                            asset: {
                                                _switch: {
                                                    name: 'assetTypeNative'
                                                }
                                            },
                                            amount: {
                                                low: 70000000
                                            },
                                            destination: {
                                                _value: process.env.STELLAR_SRC_ACC
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
]

/**
 * Handle addition of wrong destination account
 */
let wrongDestinationKey = 
[
    {
        id: "e9623c4d920b8c0705ac35d0727a39b05a0bfa802833f31a65f33bd28952f0a4",
        created_at: new Date(1537962651).valueOf(),
        _attributes: {
            tx: {
                _attributes: {
                    sourceAccount: {
                        _value: 'GDUZ7SJD7MGHZLJPOYCVRCYFIZ47J2ESGXA44X5LSUGGT3FV5FEGD7D2'
                    },
                    operations: [
                        {
                            _attributes: {
                                body: {
                                    _armType: {
                                        structName: 'PaymentOp'
                                    },
                                    _value: {
                                        _attributes: {
                                            asset: {
                                                _switch: {
                                                    name: 'assetTypeNative'
                                                }
                                            },
                                            amount: {
                                                low: 70000000
                                            },
                                            destination: {
                                                _value: 'wrong_key'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
]

/**
 * Handle addition of wrong asset type
 */
let wrongAssetType = 
[
    {
        id: "e9623c4d920b8c0705ac35d0727a39b05a0bfa802833f31a65f33bd28952f0a4",
        created_at: new Date(1537962651).valueOf(),
        _attributes: {
            tx: {
                _attributes: {
                    sourceAccount: {
                        _value: 'GDUZ7SJD7MGHZLJPOYCVRCYFIZ47J2ESGXA44X5LSUGGT3FV5FEGD7D2'
                    },
                    operations: [
                        {
                            _attributes: {
                                body: {
                                    _armType: {
                                        structName: 'PaymentOp'
                                    },
                                    _value: {
                                        _attributes: {
                                            asset: {
                                                _switch: {
                                                    name: 'assetTypeNonNative'
                                                }
                                            },
                                            amount: {
                                                low: 70000000
                                            },
                                            destination: {
                                                _value: process.env.STELLAR_SRC_ACC
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
]


/**
 * Handle addition of special number
 */
let specialNumber = 
[
    {
        id: "e9623c4d920b8c0705ac35d0727a39b05a0bfa802833f31a65f33bd28952f0a4",
        created_at: new Date(1537962651).valueOf(),
        _attributes: {
            tx: {
                _attributes: {
                    sourceAccount: {
                        _value: 'GDUZ7SJD7MGHZLJPOYCVRCYFIZ47J2ESGXA44X5LSUGGT3FV5FEGD7D2'
                    },
                    operations: [
                        {
                            _attributes: {
                                body: {
                                    _armType: {
                                        structName: 'PaymentOp'
                                    },
                                    _value: {
                                        _attributes: {
                                            asset: {
                                                _switch: {
                                                    name: 'assetTypeNative'
                                                }
                                            },
                                            amount: {
                                                low: 75000000
                                            },
                                            destination: {
                                                _value: process.env.STELLAR_SRC_ACC
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        }
    }
]

export default {
    duplicate,
    operation,
    wrongDestinationKey,
    wrongAssetType,
    specialNumber
}