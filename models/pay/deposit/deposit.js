const sequelize = require('sequelize');
const database = require('../../database');
const recruit = require('../../recruit/recruit');
const user = require('../../user/user');

const columns = {
  depositId: {
    type: sequelize.INTEGER,
    field: 'deposit_id',
    primaryKey: true,
    autoIncrement: true,
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
};

const options = {
  tableName: 'pay_deposit',
  freezeTableName: true,
  underscored: true,
};

const depositModel = database.define('deposits', columns, options);

module.exports = depositModel;
