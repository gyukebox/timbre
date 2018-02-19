const sequelize = require('sequelize');
const database = require('../../database');
const deposit = require('../deposit/deposit');

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
  amount: {
    type: sequelize.INTEGER,
    field: 'amount',
    allowNull: false,
  },
};

const options = {
  tableName: 'pay_tax',
  freezeTableName: true,
  underscored: true,
};

const taxModel = database.define('tax', columns, options);

module.exports = taxModel;
