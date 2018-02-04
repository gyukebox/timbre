const Sequelize = require('sequelize');

module.exports = {

  userRole: Sequelize.ENUM('ROLE_USER', 'ROLE_ADMIN'),
  userType: Sequelize.ENUM('ACTOR', 'CLIENT'),
};
