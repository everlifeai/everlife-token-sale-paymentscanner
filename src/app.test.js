require('dotenv').config()
const Stellar = require('stellar-sdk');
const mongoose = require('mongoose');
const model = require('everlife-token-sale-model');

const paymentsHelper = require('./helpers/payments.helper');
const coinPaymentsMock = require('./mocks/coinpayments.mock');
const stellarMock = require('./mocks/stellar.mock');

const { Lock, User, Payment } = model;
const serviceName = "paymentScanner";

/**
 * Track all payments for CoinPayments API
 */
async function trackCoinpayments(mock) {
    let success = true;
    let transactionsObject = mock;

    Object.keys(transactionsObject).map((key, index) => {
        if(transactionsObject[key].status_text != "Complete") {
            delete transactionsObject[key]
        }
    });

    try {
        // filter existing transactions
        let existingTransactions = await Promise.all(Object.keys(transactionsObject).map((key, index) => {
            return Payment.findOne({tx_id: key}).exec();
        }));
        existingTransactions = existingTransactions.filter(tx => tx != null);

        if(existingTransactions.length > 0) {
            existingTransactions.map(tx => { 
                if(tx.tx_id in transactionsObject)  {
                    delete transactionsObject[tx.tx_id]
                }
            });
        }
    } catch(err) {
        console.log(err);
        success = false;
    }

    if(Object.keys(transactionsObject).length > 0) {
        let payments = paymentsHelper.formatPaymentForCoinPayments(transactionsObject);
        
        // Save payments to MongoDB    
        if(payments.length > 0) {
            return Promise.all(payments.map(payment => payment.save()));
        }
    } else {
        return null;
    }

    return Promise.resolve(success);
}

/**
 * Track all payments for Stellar account
 */
async function trackStellarPayments(transactionsEnvelopes) {
    let success = true;
    // Filter for payments
    // 1: Operation == Payment
    // 2: Payment to Stellar receiver account
    // 3: Asset = native (XLM)
    try {
        transactionsEnvelopes = transactionsEnvelopes.filter(envelope => 
            envelope._attributes.tx._attributes.operations[0]._attributes.body._armType.structName === 'PaymentOp' &&
            envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.destination._value === process.env.STELLAR_SRC_ACC &&
            envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.asset._switch.name === 'assetTypeNative'
        );
    } catch (err) {
        success = false;
        console.log(err);
    }

    if(transactionsEnvelopes.length > 0) {
        // filter existing transactions
        let existingTransactions = await Promise.all(transactionsEnvelopes.map(envelope => {
            return Payment.findOne({tx_id: envelope.id}).exec();
        }));
        existingTransactions = existingTransactions.filter(tx => tx != null);

        if(existingTransactions.length > 0) {
            existingTransactions.map(tx => {
                transactionsEnvelopes.map(envelope => {
                    if (envelope.id === tx.tx_id) {
                        const index = transactionsEnvelopes.indexOf(envelope);

                        transactionsEnvelopes.splice(index, 1);
                    }
                });
            });
        }

        // Create payment objects
        if(transactionsEnvelopes.length > 0) {
            let payments = transactionsEnvelopes.map(tx => new Payment({
                    payment_system: 'stellar',
                    currency: 'XLM',
                    amount: parseFloat(Number(tx._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.amount["low"])/10000000.0000000).toFixed(7),
                    source_ref: tx._attributes.tx._attributes.sourceAccount._value,
                    tx_id: tx.id,
                    tx_timestamp: tx.created_at
                })
            ); 

            // Save payments to MongoDB    
            if(payments.length > 0) {
                return Promise.all(payments.map(payment => payment.save()));
            }
        }
    }

    return Promise.resolve(success);
}

/**
 * Test Stellar functionality
 */
function testStellarPayments() {
    let error = false;

    model.connectDb(process.env.DB_CONNECTION_STRING, process.env.DB_NAME)
        .then(() => Lock.acquireLock(serviceName))

        // Test 1. Duplicate
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackStellarPayments(stellarMock.duplicate);
        })
        .then(() => {
            return trackStellarPayments(stellarMock.duplicate);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            if(count !== 1) {
                console.log('Test 1 for duplicate entries failed');
                error = true;
            }            
        })

        // Test 2. Wrong operation
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackStellarPayments(stellarMock.operation);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            if(count > 0) {
                console.log('Test 2 for wrong operation failed');
                error = true;
            }            
        })

        // Test 3. Wrong destination key
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackStellarPayments(stellarMock.wrongDestinationKey);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            if(count > 0) {
                console.log('Test 3 for wrong destination key failed');
                error = true;
            }            
        })

        // Test 4. Wrong asset type
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackStellarPayments(stellarMock.wrongAssetType);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            if(count > 0) {
                console.log('Test 4 for wrong asset type failed');
                error = true;
            }            
        })

        // Test 5. Special number
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackStellarPayments(stellarMock.specialNumber);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            // Number should be equal to 7.5 --> OK
            if(count !== 1) {
                console.log('Test 5 for special number failed');
                error = true;
            }            
        })

        .then(() => Lock.releaseLock(serviceName))
        .then(() => model.closeDb())
        .then(() => {
            if(error) {
                console.log('\n-----\nOne of the tests has failed\n-----\n');
            } else {
                console.log('\n-----\nSuccessfully ran all Stellar tests\n-----\n');
            }
        })
        .catch(err => {
            console.log('Unexpected error:', err);
            process.exit(-1);
        });
}

/**
 * Test CoinPayments API
 */
function testCoinPayments() {
    let error = false;

    model.connectDb(process.env.DB_CONNECTION_STRING, process.env.DB_NAME)
        .then(() => Lock.acquireLock(serviceName))

        // Test 1. Empty
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackCoinpayments(coinPaymentsMock.empty);
        })
        .then(() => {
            return Payment.countDocuments({}).exec()
        })
        .then((count) => {
            if(count !== 0) {
                console.log('Test 1 for empty object failed');
                error = false;
            }            
        })

        // Test 2. Duplicate
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackCoinpayments(coinPaymentsMock.duplicate);
        })
        .then(() => {
            return Payment.countDocuments({}).exec();
        })
        .then((count) => {
            if(count !== 1) {
                console.log('Test 2 for duplicate object failed');
                error = true;
            }            
        })

        // Test 3. Not completed status
        .then(() => {
            return Payment.deleteMany({ }).exec();
        })
        .then(() => {
            return trackCoinpayments(coinPaymentsMock.notCompleted);
        })
        .then(() => {
            return Payment.countDocuments({}).exec()
        })
        .then((count) => {
            if(count !== 0) {
                console.log('Test 3 for not completed status object failed');
                error = true;
            }            
        }) 

        .then(() => Lock.releaseLock(serviceName))
        .then(() => model.closeDb())
        .then(() => {
            if(error) {
                console.log('\n-----\nOne of the tests has failed\n-----\n');
            } else {
                console.log('\n-----\nSuccessfully ran all CoinPayments tests\n-----\n');
            }
        })
        .catch(err => {
            console.log('Unexpected error:', err);
            process.exit(-1);
        });
}

/*
 * Starting point tests
 * 
 * First test CoinPayments functionality
 * Then test StellarPayments functionality after delay of 5 seconds
 */
testCoinPayments();
setTimeout(testStellarPayments, 15000);
