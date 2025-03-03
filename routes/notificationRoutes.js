const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
  deleteNotification,
  registerDeviceToken
} = require('../controllers/notificationController');

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);
router.post('/device-token', protect, registerDeviceToken);

module.exports = router;