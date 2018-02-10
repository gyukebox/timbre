const Sequelize = require('sequelize');

module.exports = {
  userRole: Sequelize.ENUM('ROLE_USER', 'ROLE_ADMIN'),
  userType: Sequelize.ENUM('ACTOR', 'CLIENT'),
  recruitStateType: Sequelize.ENUM(
    'REGISTERED', 'WAIT_DEPOSIT', 'ON_BIDDINGS', 'WAIT_FEEDBACK',
    'ON_WITHDRAW', 'DONE', 'CANCELLED',
  ),
};
