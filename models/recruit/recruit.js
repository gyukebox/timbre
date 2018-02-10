const sequelize = require('sequelize');
const types = require('../type/types');
const database = require('../database');
const user = require('../user/user');

const columns = {
  recruit_id: {
    type: sequelize.INTEGER,
    field: 'recruit_id',
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: sequelize.INTEGER,
    field: 'client_id',
    references: {
      model: user,
      key: 'user_id',
    },
  },
  client_name: {
    type: sequelize.STRING(100),
    field: 'client_name',
  },
  actor_id: {
    type: sequelize.INTEGER,
    field: 'actor_id',
    allowNull: true,
  },
  actor_name: {
    type: sequelize.STRING(100),
    field: 'actor_name',
    allowNull: true,
  },
  title: sequelize.STRING(64),
  description: sequelize.STRING(512),
  state: {
    type: types.recruitStateType,
    defaultValue: 'WAIT_DEPOSIT',
  },
  category: sequelize.STRING(100),
  mood: sequelize.STRING(100),
  amount: {
    type: sequelize.INTEGER,
    validate: {
      min: 30000,
      max: Number.MAX_VALUE,
    },
  },
  active: {
    type: sequelize.BOOLEAN,
    defaultValue: true,
  },
  bid_count: {
    type: sequelize.INTEGER,
    field: 'bid_count',
    defaultValue: 0,
  },
  bidding_id: {
    type: sequelize.INTEGER,
    field: 'bidding_id',
    allowNull: true,
  },
  version_count: {
    type: sequelize.INTEGER,
    field: 'version_count',
    defaultValue: 0,
  },
  current_version: {
    type: sequelize.INTEGER,
    field: 'current_version',
    defaultValue: 0,
  },
  process_due_date: {
    type: sequelize.DATE,
    field: 'process_due_date',
  },
  recruit_due_date: {
    type: sequelize.DATE,
    field: 'recruit_due_date',
  },
  sample: {
    type: sequelize.STRING(1000),
    field: 'sample',
  },
};

const options = {
  tableName: 'recruits',
  freezeTableName: true,
  underscored: true,
};

const recruitModel = database.define('recruit', columns, options);
recruitModel.belongsTo(user, { foreignKey: 'client_id' });

module.exports = recruitModel;
