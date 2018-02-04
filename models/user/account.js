const Sequelize = require('sequelize');

const user = require('./user');
const database = require('../database');

const columns = {

  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    references: {
      model: user,
      key: 'user_id',
    },
    primaryKey: true,
  },
  password: {
    type: Sequelize.STRING(300),
    allowNull: false,
  },
  bankType: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  bankAccount: {
    type: Sequelize.STRING(200),
    allowNull: true,
  },
};

const options = {

  tableName: 'accounts',
  freezeTableName: true,
  underscored: true,
  createdAt: false,
};

module.exports = database.define('account', columns, options);
