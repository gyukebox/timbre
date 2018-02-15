const sequelize = require('sequelize');
const types = require('../type/types');
const database = require('../database');

const columns = {
  userId: {
    type: sequelize.INTEGER,
    field: 'user_id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: sequelize.STRING(100),
    unique: true,
    allowNull: false,
  },
  mail: {
    type: sequelize.STRING(300),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
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
    type: sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  introduction: {
    type: sequelize.STRING(2000),
    allowNull: true,
  },
  profile: {
    type: sequelize.STRING(300),
    allowNull: true,
  },
  token: {
    type: sequelize.STRING(300),
    allowNull: true,
  },
  expiry: {
    type: sequelize.DATE,
    allowNull: true,
  },
  authenticated: {
    type: sequelize.DATE,
    allowNull: true,
  },
};

const options = {
  tableName: 'users',
  freezeTableName: true,
  underscored: true,
};

const userModel = database.define('user', columns, options);

process.nextTick(() => {
  const account = require('./account');
  userModel.hasOne(account, { foreignKey: 'userId' });
});

module.exports = userModel;
