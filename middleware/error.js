const errorHandler = (err, req, res, next) => {
    console.error(err); // Para depuración
  
    if (err?.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no válido' 
      });
    }
  
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
  
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Error del servidor'
    });
  };
  
  module.exports = errorHandler;
  