const sequelize = require('sequelize');
const database = require('../../database');
const deposit = require('../deposit/deposit');
const recruit = require('../../recruit/recruit');
const user = require('../../user/user');
const types = require('../../type/types');

const columns = {
  historyId: {
    type: sequelize.INTEGER,
    field: 'history_id',
    primaryKey: true,
    autoIncrement: true,
  },
  depositId: {
    type: sequelize.INTEGER,
    field: 'deposit_id',
    references: {
      model: deposit,
      key: 'deposit_id',
    },
  },
  recruitId: {
    type: sequelize.INTEGER,
    field: 'recruit_id',
    references: {
      model: recruit,
      key: 'recruit_id',
    },
  },
  clientId: {
    type: sequelize.INTEGER,
    field: 'client_id',
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
  bankType: {
    type: types.bankType,
    field: 'bank_type',
    allowNull: true,
  },
  bankAccount: {
    type: sequelize.STRING(200),
    field: 'bank_account',
    allowNull: true,
  },
};

const options = {
  tableName: 'pay_deposit_history',
  freezeTableName: true,
  underscored: true,
};

const historyModel = database.define('deposit_histories', columns, options);

module.exports = historyModel;
