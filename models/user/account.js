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
    validate: {
      len: [4, 16],
      is: /[A - Z]+\w+\d+/,
    },
  },
  bank_type: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  bank_account: {
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

const accountModel = database.define('account', columns, options);
process.nextTick(() => {
  accountModel.belongsTo(user, { foreignKey: 'userId' });
});

module.exports = accountModel;
