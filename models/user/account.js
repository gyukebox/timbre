const sequelize = require('sequelize');

const user = require('./user');
const types = require('../type/types');
const database = require('../database');

const columns = {
  userId: {
    type: sequelize.INTEGER,
    field: 'user_id',
    references: {
      model: user,
      key: 'user_id',
    },
    primaryKey: true,
  },
  password: {
    type: sequelize.STRING(300),
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
  tableName: 'accounts',
  freezeTableName: true,
  underscored: true,
  createdAt: false,
};

const accountModel = database.define('account', columns, options);
process.nextTick(() => {
  accountModel.belongsTo(user, { foreignKey: 'userId' });
});

module.exports = accountModel;
