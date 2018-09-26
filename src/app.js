require('dotenv').config();
const Stellar = require('stellar-sdk');
const mongoose = require('mongoose');
const model = require('everlife-token-sale-model');

import paymentsHelper from './helpers/payments.helper';
import coinPaymentsHelper from './helpers/coinpayments.helper';
import stellarPaymentsHelper from './helpers/stellarPayments.helper';

const { Lock, User, Payment } = model;

/**
 * Track all payments for CoinPayments API
 */
async function trackCoinpayments() {
    let transactionsObject = coinPaymentsHelper.getCoinPaymentTransactions(process.env.COINPAYMENT_KEY, process.env.COINPAYMENT_SECRET);

    // Filter all pending and failed transactions
    Object.keys(transactionsObject).map((key, index) => {
        if(transactionsObject[key].status_text != "Complete") {
            delete transactionsObject[key]
        }
    });

    // filter existing transactions
    try {
        model.connectDb(process.env.MONGO_DB_URL, process.env.MONGO_COLLECTION)

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

        model.closeDb();
    } catch(err) {
        console.log(err);
        throw err;
    }

    if(Object.keys(transactionsObject).length > 0) {
        let payments = paymentsHelper.formatPaymentForCoinPayments(transactionsObject);
        
        // Save payments to MongoDB    
        paymentsHelper.savePayments(payments);
    }
}


/**
 * Track all payments for Stellar account
 */
async function trackStellarPayments() {
    let transactions = await stellarPaymentsHelper.getStellarTransactions(process.env.STELLAR_SRC_ACC);
    
    // Decode transactionEnvelope XDR and add id & timestamp
    let transactionsEnvelopes = transactions._embedded.records.map(record => {
        let result = Stellar.xdr.TransactionEnvelope.fromXDR(record.envelope_xdr, 'base64');
        result.id = record.id;
        result.created_at = new Date(record.created_at).valueOf(); 

        return result; 
    });

    // Filter for payments
    // 1: Operation == Payment
    // 2: Payment to Stellar receiver account
    // 3: Asset = native (XLM)
    transactionsEnvelopes = transactionsEnvelopes.filter(envelope => 
        envelope._attributes.tx._attributes.operations[0]._attributes.body._armType.structName === 'PaymentOp' &&
        Stellar.StrKey.encodeEd25519PublicKey(envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.destination._value) === process.env.STELLAR_SRC_ACC &&
        envelope._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.asset._switch.name === 'assetTypeNative'
    );


    // filter existing transactions
    if(transactionsEnvelopes.length > 0) {
        try {
            model.connectDb(process.env.MONGO_DB_URL, process.env.MONGO_COLLECTION)
    
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
    
            model.closeDb();
        } catch(err) {
            console.log(err);
        }
    }

    // Create payment objects
    if(transactionsEnvelopes.length > 0) {
        let payments = paymentsHelper.formatPaymentForStellar(transactionsEnvelopes);

        // Save payments to Mongo
        paymentsHelper.savePayments(payments); 
    }

}

/**
 * Starting point of application
 */
trackCoinpayments();
trackStellarPayments();
