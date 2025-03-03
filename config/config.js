module.exports = {
    // Firebase Cloud Messaging Server Key para notificaciones push
    fcmServerKey: process.env.FCM_SERVER_KEY,
    
    // Configuración para MongoDB
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/prestamosapp',
    
    // JWT configuración
    jwtSecret: process.env.JWT_SECRET || '2J9PFA2P9D2A9PFAP2DA29FADIFJA',
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    
    // Puerto del servidor
    port: process.env.PORT || 5000,
    
    // Entorno
    nodeEnv: process.env.NODE_ENV || 'development'
  };