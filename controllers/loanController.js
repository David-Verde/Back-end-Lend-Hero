const Loan = require('../models/Loan');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendNotification = require('../utils/notifications');

// @desc    Crear solicitud de préstamo
// @route   POST /api/loans/request
// @access  Private
exports.createLoanRequest = async (req, res) => {
  try {
    const { lenderId, amount, description, dueDate, paymentType, installmentsCount, groupId } = req.body;
    
    // Verificar si el prestamista existe
    const lender = await User.findById(lenderId);
    if (!lender) {
      return res.status(404).json({
        success: false,
        message: 'Usuario prestamista no encontrado'
      });
    }

    // Crear el préstamo con estado PENDING
    const loan = await Loan.create({
      lender: lenderId,
      borrower: req.user.id,
      amount,
      description,
      dueDate,
      paymentType: paymentType || 'LUMP_SUM',
      installmentsCount: installmentsCount || 1,
      group: groupId || null
    });

    // Crear notificación para el prestamista
    const notification = await Notification.create({
      recipient: lenderId,
      sender: req.user.id,
      type: 'LOAN_REQUEST',
      content: `${req.user.name} te ha solicitado un préstamo de $${amount}`,
      relatedLoan: loan._id
    });

    // Enviar notificación push si el usuario tiene token FCM
    if (lender.fcmToken) {
      await sendNotification(
        lender.fcmToken,
        'Nueva solicitud de préstamo',
        `${req.user.name} te ha solicitado un préstamo de $${amount}`
      );
    }

    res.status(201).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener préstamo por ID
// @route   GET /api/loans/:id
// @access  Private
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('lender', 'name email')
      .populate('borrower', 'name email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Verificar que el usuario es parte del préstamo
    if (loan.lender._id.toString() !== req.user.id && 
        loan.borrower._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este préstamo'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener mis préstamos
// @route   GET /api/loans/myloans
// @access  Private
exports.getMyLoans = async (req, res) => {
  try {
    // Préstamos donde soy prestamista
    const loansGiven = await Loan.find({ lender: req.user.id })
      .populate('borrower', 'name email')
      .sort('-createdAt');

    // Préstamos donde soy deudor
    const loansReceived = await Loan.find({ borrower: req.user.id })
      .populate('lender', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: {
        loansGiven,
        loansReceived
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Aprobar préstamo
// @route   PUT /api/loans/:id/approve
// @access  Private
exports.approveLoan = async (req, res) => {
  try {
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Verificar que el usuario es el prestamista
    if (loan.lender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para aprobar este préstamo'
      });
    }

    // Verificar que el préstamo está pendiente
    if (loan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `No se puede aprobar un préstamo con estado ${loan.status}`
      });
    }

    // Actualizar estado
    loan.status = 'APPROVED';
    await loan.save();

    // Obtener información del prestatario
    const borrower = await User.findById(loan.borrower);

    // Crear notificación para el prestatario
    await Notification.create({
      recipient: loan.borrower,
      sender: req.user.id,
      type: 'LOAN_APPROVAL',
      content: `Tu solicitud de préstamo por $${loan.amount} ha sido aprobada`,
      relatedLoan: loan._id
    });

    // Enviar notificación push si el prestatario tiene token FCM
    if (borrower.fcmToken) {
      await sendNotification(
        borrower.fcmToken,
        'Préstamo aprobado',
        `Tu solicitud de préstamo por $${loan.amount} ha sido aprobada`
      );
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Rechazar préstamo
// @route   PUT /api/loans/:id/reject
// @access  Private
exports.rejectLoan = async (req, res) => {
  try {
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Verificar que el usuario es el prestamista
    if (loan.lender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para rechazar este préstamo'
      });
    }

    // Verificar que el préstamo está pendiente
    if (loan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `No se puede rechazar un préstamo con estado ${loan.status}`
      });
    }

    // Actualizar estado
    loan.status = 'REJECTED';
    await loan.save();

    // Obtener información del prestatario
    const borrower = await User.findById(loan.borrower);

    // Crear notificación para el prestatario
    await Notification.create({
      recipient: loan.borrower,
      sender: req.user.id,
      type: 'LOAN_REJECTION',
      content: `Tu solicitud de préstamo por $${loan.amount} ha sido rechazada`,
      relatedLoan: loan._id
    });

    // Enviar notificación push si el prestatario tiene token FCM
    if (borrower.fcmToken) {
      await sendNotification(
        borrower.fcmToken,
        'Préstamo rechazado',
        `Tu solicitud de préstamo por $${loan.amount} ha sido rechazada`
      );
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Realizar un pago
// @route   POST /api/loans/:id/payment
// @access  Private
exports.makePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Verificar que el usuario es el deudor
    if (loan.borrower.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para realizar pagos a este préstamo'
      });
    }

    // Verificar que el préstamo está aprobado
    if (loan.status !== 'APPROVED' && loan.status !== 'ACTIVE' && loan.status !== 'LATE') {
      return res.status(400).json({
        success: false,
        message: `No se puede pagar un préstamo con estado ${loan.status}`
      });
    }

    // Agregar el pago
    loan.payments.push({
      amount,
      status: 'COMPLETED'
    });

    // Actualizar conteo de cuotas pagadas si es por cuotas
    if (loan.paymentType === 'INSTALLMENTS') {
      loan.installmentsPaid += 1;
    }

    // Verificar si el préstamo está completamente pagado
    const totalPaid = loan.payments.reduce((acc, payment) => acc + payment.amount, 0);
    
    if (totalPaid >= loan.amount) {
      loan.status = 'COMPLETED';
    } else {
      // Si no está completamente pagado, cambiar a ACTIVE si estaba en otro estado
      if (loan.status !== 'ACTIVE') {
        loan.status = 'ACTIVE';
      }
    }

    await loan.save();

    // Obtener información del prestamista
    const lender = await User.findById(loan.lender);

    // Crear notificación para el prestamista
    await Notification.create({
      recipient: loan.lender,
      sender: req.user.id,
      type: 'PAYMENT_RECEIVED',
      content: `${req.user.name} ha realizado un pago de $${amount} para su préstamo`,
      relatedLoan: loan._id
    });

    // Enviar notificación push si el prestamista tiene token FCM
    if (lender.fcmToken) {
      await sendNotification(
        lender.fcmToken,
        'Pago recibido',
        `${req.user.name} ha realizado un pago de $${amount} para su préstamo`
      );
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Actualizar estado del préstamo
// @route   PUT /api/loans/:id/status
// @access  Private
exports.updateLoanStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    let loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado'
      });
    }

    // Verificar que el usuario es el prestamista o el deudor
    if (loan.lender.toString() !== req.user.id && 
        loan.borrower.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este préstamo'
      });
    }

    // Actualizar estado
    loan.status = status;
    await loan.save();

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
