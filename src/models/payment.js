// Reference model - Real model comes from everlife-token-sale-model
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
        payment_system: {
            type: String,
            required: true,
            enum: ['stellar', 'coinpayments']},
        currency: {
            type: String,
            required: true },
        amount: {
            type: Number,
            required: true },
        source_ref: {
            type: String,
            required: true },
        tx_id: {
            type: String,
            required: true },
        tx_timestamp: {
            type: Date,
            required: true },
        tx_info: {
            type: mongoose.Schema.Types.Mixed,
            default: null }
    },
    { timestamps: true }
);

paymentSchema.index({ tx_id: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;