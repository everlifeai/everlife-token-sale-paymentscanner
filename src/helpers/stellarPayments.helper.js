require('dotenv').config();
const log = require('util').log;
const rp = require('request-promise');
const model = require('everlife-token-sale-model');

const { Lock, User, Payment } = model;
const serviceName = "paymentScanner";

/**
 * Helper for retrieving all transactions for Stellar public key
 * @param {string} sourceAccount 
 */
const getStellarTransactions = async (sourceAccount) => {
    let address;
    if(process.env.STELLAR_PUBLIC.toLowerCase() === "true") {
        address = 'https://horizon.stellar.org';
    } else {
        log("[getStellarTransactions] Using TEST stellar network");
        address = 'https://horizon-testnet.stellar.org';
    }

    let transactions;
    const options = {
        uri: `${address}/accounts/${sourceAccount}/transactions`,
        qs: {
            limit: '200',
            order: 'desc'
        },
        headers: {},
        json: true
    };

    try {
        transactions = await rp(options);
    } catch (err) {
        console.log("Error:\nStellar source account not found");
        await Lock.releaseLock(serviceName)
        await model.closeDb()
        process.exit(-1);
    }

    return transactions;
}

module.exports = {
    getStellarTransactions
}