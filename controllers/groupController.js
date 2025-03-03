const Group = require('../models/Group');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Notification = require('../models/Notification');
const GroupLoanContribution = require('../models/GroupLoanContribution');
const sendNotification = require('../utils/notifications');

// @desc    Crear un grupo
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    // Crear el grupo
    const group = await Group.create({
      name,
      description,
      admin: req.user.id,
      members: [{ user: req.user.id, role: 'ADMIN' }]
    });

    // Añadir grupo al usuario administrador
    await User.findByIdAndUpdate(req.user.id, {
      $push: { groups: group._id }
    });

    // Si hay miembros adicionales, añadirlos
    if (memberIds && memberIds.length > 0) {
      // Verificar que todos los usuarios existen
      for (const memberId of memberIds) {
        const memberExists = await User.findById(memberId);
        
        if (memberExists) {
          // Añadir miembro al grupo
          await Group.findByIdAndUpdate(group._id, {
            $push: { members: { user: memberId, role: 'MEMBER' } }
          });

          // Añadir grupo al usuario
          await User.findByIdAndUpdate(memberId, {
            $push: { groups: group._id }
          });

          // Crear notificación
          await Notification.create({
            recipient: memberId,
            sender: req.user.id,
            type: 'GROUP_INVITATION',
            content: `${req.user.name} te ha añadido al grupo "${name}"`,
            relatedGroup: group._id
          });

          // Enviar notificación push si el usuario tiene token FCM
          if (memberExists.fcmToken) {
            await sendNotification(
              memberExists.fcmToken,
              'Invitación a grupo',
              `${req.user.name} te ha añadido al grupo "${name}"`
            );
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener mis grupos
// @route   GET /api/groups/mygroups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    // Buscar grupos donde el usuario es miembro
    const groups = await Group.find({
      'members.user': req.user.id
    }).populate('admin', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Obtener grupo por ID
// @route   GET /api/groups/:id
// @access  Private
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email')
      .populate({
        path: 'loans',
        populate: [
          { path: 'borrower', select: 'name email' },
          { path: 'lender', select: 'name email' }
        ]
      });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar que el usuario es miembro del grupo
    const isMember = group.members.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este grupo'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Añadir miembro a grupo
// @route   POST /api/groups/:id/members
// @access  Private
exports.addMemberToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verificar que el grupo existe
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar que el usuario que hace la petición es administrador
    const isAdmin = group.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'ADMIN'
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para añadir miembros a este grupo'
      });
    }

    // Verificar que el usuario a añadir existe
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el usuario no es ya miembro
    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es miembro del grupo'
      });
    }

    // Añadir miembro al grupo
    await Group.findByIdAndUpdate(req.params.id, {
      $push: { members: { user: userId, role: 'MEMBER' } }
    });

    // Añadir grupo al usuario
    await User.findByIdAndUpdate(userId, {
      $push: { groups: group._id }
    });

    // Crear notificación
    await Notification.create({
      recipient: userId,
      sender: req.user.id,
      type: 'GROUP_INVITATION',
      content: `${req.user.name} te ha añadido al grupo "${group.name}"`,
      relatedGroup: group._id
    });

    // Enviar notificación push si el usuario tiene token FCM
    if (user.fcmToken) {
      await sendNotification(
        user.fcmToken,
        'Invitación a grupo',
        `${req.user.name} te ha añadido al grupo "${group.name}"`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Miembro añadido correctamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Eliminar miembro de grupo
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
exports.removeMemberFromGroup = async (req, res) => {
  try {
    // Verificar que el grupo existe
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar que el usuario que hace la petición es administrador
    const isAdmin = group.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'ADMIN'
    );

    // O que el usuario se está eliminando a sí mismo
    const isSelfRemoval = req.params.userId === req.user.id;

    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar miembros de este grupo'
      });
    }

    // No permitir eliminar al administrador (a menos que sea un administrador eliminándose a sí mismo)
    if (group.admin.toString() === req.params.userId && !isSelfRemoval) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar al administrador del grupo'
      });
    }

    // Eliminar miembro del grupo
    await Group.findByIdAndUpdate(req.params.id, {
      $pull: { members: { user: req.params.userId } }
    });

    // Eliminar grupo del usuario
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { groups: group._id }
    });

    // Si el usuario se está eliminando a sí mismo y es el administrador, asignar un nuevo administrador
    if (isSelfRemoval && group.admin.toString() === req.user.id) {
      // Buscar otro miembro para ser administrador
      const newAdmin = group.members.find(member => 
        member.user.toString() !== req.user.id
      );

      if (newAdmin) {
        // Actualizar el rol del nuevo administrador
        await Group.updateOne(
          { _id: group._id, 'members.user': newAdmin.user },
          { $set: { 'members.$.role': 'ADMIN', admin: newAdmin.user } }
        );

        // Notificar al nuevo administrador
        const adminUser = await User.findById(newAdmin.user);
        await Notification.create({
          recipient: newAdmin.user,
          sender: req.user.id,
          type: 'GROUP_INVITATION',
          content: `Ahora eres el administrador del grupo "${group.name}"`,
          relatedGroup: group._id
        });

        if (adminUser.fcmToken) {
          await sendNotification(
            adminUser.fcmToken,
            'Administración de grupo',
            `Ahora eres el administrador del grupo "${group.name}"`
          );
        }
      } else {
        // Si no hay más miembros, eliminar el grupo
        await Group.findByIdAndDelete(group._id);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Miembro eliminado correctamente'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Crear solicitud de préstamo de grupo
// @route   POST /api/groups/:id/loans
// @access  Private
exports.createGroupLoanRequest = async (req, res) => {
  try {
    const { amount, description, dueDate, paymentType, installmentsCount } = req.body;
    
    // Verificar que el grupo existe
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar que el usuario es miembro del grupo
    const isMember = group.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo'
      });
    }

    // Crear el préstamo con el grupo como prestamista (lender se establecerá como el admin del grupo)
    const loan = await Loan.create({
      lender: group.admin, // El administrador actúa como prestamista principal
      borrower: req.user.id,
      amount,
      description,
      dueDate,
      paymentType: paymentType || 'LUMP_SUM',
      installmentsCount: installmentsCount || 1,
      group: group._id,
      status: 'PENDING'
    });

    // Añadir el préstamo al grupo
    await Group.findByIdAndUpdate(group._id, {
      $push: { loans: loan._id }
    });

    // Notificar a todos los miembros del grupo
    for (const member of group.members) {
      if (member.user.toString() !== req.user.id) {
        // Crear notificación
        await Notification.create({
          recipient: member.user,
          sender: req.user.id,
          type: 'LOAN_REQUEST',
          content: `${req.user.name} ha solicitado un préstamo de grupo por $${amount} en "${group.name}"`,
          relatedLoan: loan._id,
          relatedGroup: group._id
        });

        // Enviar notificación push
        const memberUser = await User.findById(member.user);
        if (memberUser.fcmToken) {
          await sendNotification(
            memberUser.fcmToken,
            'Solicitud de préstamo de grupo',
            `${req.user.name} ha solicitado un préstamo de grupo por $${amount} en "${group.name}"`
          );
        }
      }
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

// @desc    Contribuir a un préstamo de grupo
// @route   POST /api/groups/:id/loans/:loanId/contribute
// @access  Private
exports.contributeToGroupLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Verificar que el grupo existe
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    // Verificar que el préstamo existe y pertenece al grupo
    const loan = await Loan.findOne({
      _id: req.params.loanId,
      group: req.params.id
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Préstamo no encontrado en este grupo'
      });
    }

    // Verificar que el usuario es miembro del grupo
    const isMember = group.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'No eres miembro de este grupo'
      });
    }

    // Verificar que el préstamo está pendiente o aprobado
    if (loan.status !== 'PENDING' && loan.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `No se puede contribuir a un préstamo con estado ${loan.status}`
      });
    }

    // Verificar que el usuario no es el prestatario
    if (loan.borrower.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes contribuir a tu propio préstamo'
      });
    }

    // Crear la contribución
    const contribution = await GroupLoanContribution.create({
      loan: loan._id,
      contributor: req.user.id,
      amount,
      status: 'CONFIRMED'
    });

    // Si el préstamo estaba pendiente, cambiarlo a aprobado
    if (loan.status === 'PENDING') {
      loan.status = 'APPROVED';
      await loan.save();

      // Notificar al prestatario
      const borrower = await User.findById(loan.borrower);
      await Notification.create({
        recipient: loan.borrower,
        sender: req.user.id,
        type: 'LOAN_APPROVAL',
        content: `Tu solicitud de préstamo por $${loan.amount} en el grupo "${group.name}" ha sido aprobada`,
        relatedLoan: loan._id,
        relatedGroup: group._id
      });

      if (borrower.fcmToken) {
        await sendNotification(
          borrower.fcmToken,
          'Préstamo de grupo aprobado',
          `Tu solicitud de préstamo por $${loan.amount} en el grupo "${group.name}" ha sido aprobada`
        );
      }
    }

    // Notificar a todos los miembros del grupo
    for (const member of group.members) {
      if (member.user.toString() !== req.user.id && member.user.toString() !== loan.borrower.toString()) {
        await Notification.create({
          recipient: member.user,
          sender: req.user.id,
          type: 'PAYMENT_RECEIVED',
          content: `${req.user.name} ha contribuido con $${amount} al préstamo de ${borrower.name} en "${group.name}"`,
          relatedLoan: loan._id,
          relatedGroup: group._id
        });

        const memberUser = await User.findById(member.user);
        if (memberUser.fcmToken) {
          await sendNotification(
            memberUser.fcmToken,
            'Contribución a préstamo de grupo',
            `${req.user.name} ha contribuido con $${amount} al préstamo de ${borrower.name} en "${group.name}"`
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      data: contribution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};