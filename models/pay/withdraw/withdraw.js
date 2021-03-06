const sequelize = require('sequelize');
const database = require('../../database');
const deposit = require('../deposit/deposit');
const user = require('../../user/user');

const columns = {
  depositId: {
    type: sequelize.INTEGER,
    field: 'deposit_id',
    primaryKey: true,
    references: {
      model: deposit,
      key: 'deposit_id',
    },
  },
  actorId: {
    type: sequelize.INTEGER,
    field: 'actor_id',
    references: {
      model: user,
      key: 'user_id',
    },
  },
  amount: {
    type: sequelize.INTEGER,
    field: 'amount',
    allowNull: false,
  },
};

const options = {
  tableName: 'pay_withdraw',
  freezeTableName: true,
  underscored: true,
};

const withdrawModel = database.define('withdraws', columns, options);

module.exports = withdrawModel;
