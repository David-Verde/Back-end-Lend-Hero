const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {
  createLoanRequest,
  getLoanById,
  getMyLoans,
  approveLoan,
  rejectLoan,
  makePayment,
  updateLoanStatus
} = require('../controllers/loanController');

router.post('/request', protect, createLoanRequest);
router.get('/myloans', protect, getMyLoans);
router.get('/:id', protect, getLoanById);
router.put('/:id/approve', protect, approveLoan);
router.put('/:id/reject', protect, rejectLoan);
router.post('/:id/payment', protect, makePayment);
router.put('/:id/status', protect, updateLoanStatus);

module.exports = router;