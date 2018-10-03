require('dotenv').config();
const rp = require('request-promise');

/**
 * Helper for retrieving all transactions for Stellar public key
 * @param {string} sourceAccount 
 */
const getStellarTransactions = async (sourceAccount) => {
    let address;
    if(Boolean(process.env.STELLAR_PUBLIC)) {
        address = 'https://horizon.stellar.org';
    } else {
        address = 'https://horizon-testnet.stellar.org';
    }

    let transactions;
    const options = {
        uri: `https://horizon-testnet.stellar.org/accounts/${sourceAccount}/transactions`,
        qs: {},
        headers: {},
        json: true
    };

    try {
        transactions = await rp(options);
    } catch (err) {
        console.log(err);
        throw err;
    }

    return transactions;
}

module.exports = {
    getStellarTransactions
}