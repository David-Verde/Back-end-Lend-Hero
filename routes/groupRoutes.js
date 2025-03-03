const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
  createGroupLoanRequest,
  contributeToGroupLoan
} = require('../controllers/groupController');

router.post('/', protect, createGroup);
router.get('/mygroups', protect, getMyGroups);
router.get('/:id', protect, getGroupById);
router.post('/:id/members', protect, addMemberToGroup);
router.delete('/:id/members/:userId', protect, removeMemberFromGroup);
router.post('/:id/loans', protect, createGroupLoanRequest);
router.post('/:id/loans/:loanId/contribute', protect, contributeToGroupLoan);

module.exports = router;
