/**
 * Middleware para validar campos requeridos en el cuerpo de la solicitud
 * @param {Array} fields - Array de campos a validar
 * @returns {Function} - Middleware de Express
 */
exports.validateFields = (fields) => {
    return (req, res, next) => {
      for (const field of fields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            message: `El campo '${field}' es requerido`
          });
        }
      }
      next();
    };
  };
  
  /**
   * Middleware para validar IDs de MongoDB
   * @param {string} paramName - Nombre del parámetro a validar
   * @returns {Function} - Middleware de Express
   */
  exports.validateMongoId = (paramName) => {
    return (req, res, next) => {
      const id = req.params[paramName] || req.body[paramName];
      
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: `El ID '${paramName}' no es válido`
        });
      }
      
      next();
    };
  };