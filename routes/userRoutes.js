const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers // Nueva función
} = require('../controllers/userController');

const router = express.Router();

// Obtener todos los usuarios
router.get('/', protect, getUsers);

// Obtener un usuario por ID
router.get('/:id', protect, getUserById);

// Buscar usuarios por nombre o email
router.get('/search', protect, searchUsers); // Nueva ruta

// Actualizar un usuario
router.put('/:id', protect, updateUser);

// Eliminar un usuario
router.delete('/:id', protect, deleteUser);

module.exports = router;