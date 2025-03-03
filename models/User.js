const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor añade un nombre']
  },
  email: {
    type: String,
    required: [true, 'Por favor añade un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor añade un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Por favor añade una contraseña'],
    minlength: 6,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Nuevos campos
  fcmToken: {
    type: String,
    default: null
  },
  // Referencia a préstamos donde el usuario es prestamista
  loansGiven: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }],
  // Referencia a préstamos donde el usuario es deudor
  loansReceived: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  }],
  // Grupos a los que pertenece el usuario
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
});

// Los métodos que ya tienes para JWT y contraseñas
UserSchema.pre('save', async function(next) {
  if(!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);


