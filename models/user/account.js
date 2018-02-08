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
    field: 'bank_type',
    allowNull: true,
  },
  bankAccount: {
    type: Sequelize.STRING(200),
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
