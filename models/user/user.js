const Sequelize = require('sequelize');
const types = require('../type/types');
const database = require('../database');

const columns = {

  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(100),
    unique: true,
    allowNull: false,
  },
  mail: {
    type: Sequelize.STRING(300),
    unique: true,
    allowNull: false,
  },
  role: {
    type: types.userRole,
    allowNull: false,
    defaultValue: 'ROLE_USER',
  },
  type: {
    type: types.userType,
    allowNull: false,
  },
  active: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  introduction: {
    type: Sequelize.STRING(2000),
    allowNull: true,
  },
  profile: {
    type: Sequelize.STRING(300),
    allowNull: true,
  },
  token: {
    type: Sequelize.STRING(300),
    allowNull: true,
  },
  expiry: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  authenticated: {
    type: Sequelize.DATE,
    allowNull: true,
  },
};

const options = {

  tableName: 'users',
  freezeTableName: true,
  underscored: true,
};

module.exports = database.define('user', columns, options);
