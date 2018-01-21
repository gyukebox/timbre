const Sequelize = require('sequelize');

module.exports = {

  role: Sequelize.ENUM('ROLE_USER', 'ROLE_ADMIN'),
  type: Sequelize.ENUM('ACTOR', 'CLIENT'),
};
