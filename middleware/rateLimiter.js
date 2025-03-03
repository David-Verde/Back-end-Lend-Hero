const rateLimit = require('express-rate-limit');

/**
 * Middleware para limitar el número de solicitudes por IP
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @param {number} max - Número máximo de solicitudes
 * @param {string} message - Mensaje de error
 * @returns {Function} - Middleware de rateLimit
 */
const createLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Demasiadas solicitudes, por favor intenta nuevamente más tarde') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    headers: true
  });
};

// Limiter para rutas de autenticación
exports.authLimiter = createLimiter(
  60 * 60 * 1000,  // 60 minutos
  10,              // 10 solicitudes máximo
  'Demasiados intentos de inicio de sesión, por favor intenta nuevamente después de una hora'
);

// Limiter general para la API
exports.apiLimiter = createLimiter();

// Limiter para crear préstamos
exports.loanLimiter = createLimiter(
  60 * 60 * 1000,  // 60 minutos
  20,              // 20 solicitudes máximo
  'Has alcanzado el límite de solicitudes de préstamo, por favor intenta más tarde'
);