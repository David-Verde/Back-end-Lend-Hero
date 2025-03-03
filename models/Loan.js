// models/Loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Por favor añade un monto']
  },
  description: {
    type: String,
    required: [true, 'Por favor añade una descripción']
  },
  lender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'LATE'],
    default: 'PENDING'
  },
  paymentType: {
    type: String,
    enum: ['LUMP_SUM', 'INSTALLMENTS'],
    default: 'LUMP_SUM'
  },
  installmentsCount: {
    type: Number,
    default: 1
  },
  installmentsPaid: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  payments: [{
    amount: Number,
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED'],
      default: 'PENDING'
    }
  }],
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Loan', LoanSchema);
