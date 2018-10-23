require('dotenv').config();
const log = require('util').log;
const Stellar = require('stellar-sdk');
const mongoose = require('mongoose');
const model = require('everlife-token-sale-model');

const paymentsHelper = require('./helpers/payments.helper');
const coinPaymentsHelper = require( './helpers/coinpayments.helper');
const stellarPaymentsHelper = require('./helpers/stellarPayments.helper');

const { Lock, User, Payment } = model;
const serviceName = "paymentScanner";

/**
 * Track all payments for CoinPayments API
 */
async function trackCoinpayments() {
    let success = true;
    let transactionsObject;
    try {
        transactionsObject = await coinPaymentsHelper.processAllTransactionInBatches();
        log(`[trackCoinPayments] inspecting ${Object.keys(transactionsObject).length} transactions`);
    } catch (err) {
        console.log("Error: CoinPayment not found");
        await Lock.releaseLock(serviceName)
        await model.closeDb()
        process.exit(-1);
    }

    // Filter all pending and failed transactions
    Object.keys(transactionsObject).map((key, index) => {
        if(transactionsObject[key].status_text != "Complete") { 
            delete transactionsObject[key]
        }
    });

    log(`[trackCoinPayments] processing ${Object.keys(transactionsObject).length} transactions`)

    // filter existing transactions
    try {
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
        log(err);
        success = false;
        await Lock.releaseLock(serviceName);
        await model.closeDb();
        process.exit(-1);
    }

    try {
        let existingTransactions = await Promise.all(Object.keys(transactionsObject).map((key, index) => {
            return Payment.findOne({tx_id: key}).exec();
        }));

        existingTransactions = existingTransactions.filter(tx => tx != null);
        
        log(`[trackCoinPayments] saving ${existingTransactions.length} new payments to database`)

        if(existingTransactions.length > 0) {
            existingTransactions.map(tx => { 
                if(tx.tx_id in transactionsObject)  {
                    delete transactionsObject[tx.tx_id]
                }
            });
        }
    } catch (err) {
        log(err);
        success = false;
        await Lock.releaseLock(serviceName);
        await model.closeDb();
        process.exit(-1);
    }

    if(Object.keys(transactionsObject).length > 0) {
        let payments = paymentsHelper.formatPaymentForCoinPayments(transactionsObject);


        // Save payments to MongoDB    
        let status = await paymentsHelper.savePayments(payments);
        if(!status) {
            success = false;
        }
    }

    return Promise.resolve(success);
}


/**
 * Track all payments for Stellar account
 */
async function trackStellarPayments() {
    let success = true;
    let transactions = await stellarPaymentsHelper.getStellarTransactions(process.env.STELLAR_SRC_ACC);            
    
    // Decode transactionEnvelope XDR and add id & timestamp
    let transactionsEnvelopes = transactions._embedded.records.map(record => {
        let result = Stellar.xdr.TransactionEnvelope.fromXDR(record.envelope_xdr, 'base64');
        result.id = record.id;
        result.created_at = new Date(record.created_at).valueOf(); 

        return result; 
    });


    log(`[trackStellarPayments] inspecting ${transactionsEnvelopes.length} transactions`);

    // Filter for payments
    // 1: Operation == Payment
    // 2: Payment to Stellar receiver account
    // 3: Asset = native (XLM)
    transactionsEnvelopes = transactionsEnvelopes.filter(envelope => 
        envelope._attributes.tx._attributes.operations[0]._attributes.body._armType.structName === 'PaymentOp' &&
        Stellar.StrKey.encodeEd25519PublicKey(envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.destination._value) === process.env.STELLAR_SRC_ACC &&
        envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.asset._switch.name === 'assetTypeNative'
    );


    log(`[trackStellarPayments] processing ${transactionsEnvelopes.length} payment transactions`);

    // filter existing transactions
    try {
        if(transactionsEnvelopes.length > 0) {
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
        }
    } catch (err) {
        log(err);
        success = false;
        await Lock.releaseLock(serviceName)
        await model.closeDb()
        process.exit(-1);
    }

    log(`[trackStellarPayments] saving ${transactionsEnvelopes.length} new payments to database`);

    // Create payment objects
    if(transactionsEnvelopes.length > 0) {
        let payments = paymentsHelper.formatPaymentForStellar(transactionsEnvelopes);

        // Save payments to Mongo
        let status = await paymentsHelper.savePayments(payments);
        if(!status) {
            success = false;
        }
    }

    return Promise.resolve(success);
}

/**
 * Starting point of application
 */
async function start() {
    await model.connectDb(process.env.DB_CONNECTION_STRING, process.env.DB_NAME)
    await Lock.acquireLock(serviceName)
    let stellarPaymentsStatus = await trackStellarPayments();
    let coinPaymentPaymentsStatus = await trackCoinpayments();

    if(stellarPaymentsStatus && coinPaymentPaymentsStatus) {
        log('-----Success-----');
    } else {
        log('-----Failure-----');
    }

    await Lock.releaseLock(serviceName)
    await model.closeDb()
}

// Start scanner
start();