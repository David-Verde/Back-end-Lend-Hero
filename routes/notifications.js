const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const {
  getMyNotifications,
  markNotificationAsRead,
  deleteNotification,
  registerDeviceToken
} = require('../controllers/notificationController');

// Obtener notificaciones del usuario
router.get('/', protect, getMyNotifications);

// Marcar notificación como leída
router.put('/:id/read', protect, markNotificationAsRead);

// Eliminar notificación
router.delete('/:id', protect, deleteNotification);

// Registrar token de dispositivo para notificaciones push
router.post('/device-token', protect, registerDeviceToken);

module.exports = router;