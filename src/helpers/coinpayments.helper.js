require('dotenv').config();
const log = require('util').log;
const Coinpayments = require('coinpayments');
let txCounter = 0;

/**
 * Helper for retrieving all CoinPayment transactions
 * @param {string} key public key for CoinPayment API
 * @param {string} secret secret key for CoinPayment API
 * @param {CoinPaymentObject} transactionsObject contains all keys and transaction data from CoinPayments
 */
const getMoreCoinPaymentTransactions = async (key, secret) => {
    const client = new Coinpayments({key, secret});
    const txList = await client.getTxList({
        start: txCounter,
        limit: 25
    });
    txCounter += txList.length;
    return txList.length > 0 ? client.getTxMulti(txList) : {};
};

async function processAllTransactionInBatches() {
    let moreTxs = true;
    let transactionObject = {};
    while (moreTxs) {
        let txs = await getMoreCoinPaymentTransactions(process.env.COINPAYMENT_KEY, process.env.COINPAYMENT_SECRET);
        
        // Append new transactions to object
        transactionObject = {...txs, ...transactionObject}
        moreTxs = Object.keys(txs).length > 0;
    }

    return Promise.resolve(transactionObject);
}

module.exports = {
    processAllTransactionInBatches
}