const express = require('express');
const { 
  createLoanRequest, 
  getLoanById, 
  getMyLoans, 
  approveLoan, 
  rejectLoan, 
  makePayment, 
  updateLoanStatus 
} = require('../controllers/loanController');
const { protect } = require('../middleware/auth');
const { loanLimiter } = require('../middleware/rateLimiter');
const { validateFields, validateMongoId } = require('../middleware/validator');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.post('/request', validateFields(['lenderId', 'amount', 'description', 'dueDate']), loanLimiter, createLoanRequest);
router.get('/myloans', getMyLoans);
router.get('/:id', validateMongoId('id'), getLoanById);
router.put('/:id/approve', validateMongoId('id'), approveLoan);
router.put('/:id/reject', validateMongoId('id'), rejectLoan);
router.post('/:id/payment', validateMongoId('id'), validateFields(['amount']), makePayment);
router.put('/:id/status', validateMongoId('id'), validateFields(['status']), updateLoanStatus);

module.exports = router;