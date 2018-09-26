const Coinpayments = require('coinpayments');

/**
 * Helper for retrieving all CoinPayment transactions
 * @param {string} key public key for CoinPayment API
 * @param {string} secret secret key for CoinPayment API
 * @param {CoinPaymentObject} transactionsObject contains all keys and transaction data from CoinPayments
 */
const getCoinPaymentTransactions = async (key, secret) => {
    const options =  {
        key,
        secret
    }

    var client = new Coinpayments(options); 

    const txList = await client.getTxList();

    return client.getTxMulti(txList);
}

module.exports = {
    getCoinPaymentTransactions
}