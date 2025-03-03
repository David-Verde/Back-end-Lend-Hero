require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config/config');
const errorHandler = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const loanRoutes = require('./routes/loans');
const groupRoutes = require('./routes/groups');
const notificationRoutes = require('./routes/notifications');

// Inicializar Express
const app = express();

// Conectar a MongoDB
mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error(`Error al conectar a MongoDB: ${err.message}`));

// Middleware
app.use(express.json());
app.use(cors("*"));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use('/api', apiLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => console.log(`Servidor ejecutándose en el puerto ${PORT}`));