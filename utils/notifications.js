const axios = require('axios');
const config = require('../config/config');

/**
 * Envía una notificación push a través de Firebase Cloud Messaging
 * @param {string} token - FCM token del dispositivo destinatario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo del mensaje de la notificación
 * @param {Object} data - Datos adicionales para enviar con la notificación (opcional)
 * @returns {Promise<Object>} - Respuesta de la API de FCM
 */
const sendNotification = async (token, title, body, data = {}) => {
  try {
    const message = {
      to: token,
      notification: {
        title,
        body,
        sound: 'default'
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };

    const response = await axios.post('https://fcm.googleapis.com/fcm/send', message, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${config.fcmServerKey}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error enviando notificación push:', error);
    // No lanzamos el error para evitar que falle la operación principal
    return { error: error.message };
  }
};

module.exports = sendNotification;