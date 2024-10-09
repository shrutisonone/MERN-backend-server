
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  price: Number,
  description: String,
  dateOfSale: Date,
  category: String,
  sold: Boolean
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;