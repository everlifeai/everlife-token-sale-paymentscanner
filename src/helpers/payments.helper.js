const Stellar = require('stellar-sdk');
const model = require('everlife-token-sale-model');

const { Lock, User, Payment } = model;
const serviceName = "paymentScanner";

/**
 * Helper for formatting Coinpayment responses to Mongoose Payment objects
 * @param {[ CoinPaymentResponse ]} txs 
 */
const formatPaymentForCoinPayments = (txs) => {
    return Object.keys(txs).map((key, index) =>
        new Payment({
            payment_system: 'coinpayments',
            currency: txs[key].coin,
            amount: txs[key].receivedf,
            source_ref: txs[key].payment_address,
            tx_id: key,
            tx_timestamp: txs[key].time_completed
        })
    );
}

/**
 * Helper for formatting Stellar responses to Mongoose Payment objects
 * @param {[ StellarResponseObject ]} txs 
 */
const formatPaymentForStellar = (txs) => {
    return txs.map(tx => new Payment({
            payment_system: 'stellar',
            currency: 'XLM',
            amount: parseFloat(Number(tx._attributes.tx._attributes.operations[0]._attributes.body._value._attributes.amount["low"])/10000000.0000000).toFixed(7),
            source_ref: Stellar.StrKey.encodeEd25519PublicKey(tx._attributes.tx._attributes.sourceAccount._value),
            tx_id: tx.id,
            tx_timestamp: tx.created_at
        })
    );
}

/**
 * Save payment objects to Mongo
 * @param {[ Payment ]} payments Mongoose Payment objects according to model
 */
/* const savePayments = (payments) => {
    return model.connectDb(process.env.MONGO_DB_URL, process.env.MONGO_COLLECTION)
        .then(() => Lock.acquireLock(serviceName))
        .then(() => {
            return Promise.all(payments.map(payment => payment.save()));
        })
        .then(() => Lock.releaseLock(serviceName))
        .then(() => model.closeDb())
        .catch(err => {
            console.log('Unexpected error:', err);
            process.exit(-1);
        });
} */

const savePayments = async (payments) => {
    try {
        await model.connectDb(process.env.MONGO_DB_URL, process.env.MONGO_COLLECTION)
        await Lock.acquireLock(serviceName)
        await Promise.all(payments.map(payment => payment.save()));
        await Lock.releaseLock(serviceName)
        await model.closeDb()

        return Promise.resolve(true);
    } catch (err) {
        console.log('Unexpected error:', err);
        return Promise.resolve(false);
        process.exit(-1);
    }
}

module.exports = {
    formatPaymentForCoinPayments,
    formatPaymentForStellar,
    savePayments
}