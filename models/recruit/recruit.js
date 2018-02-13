const sequelize = require('sequelize');
const types = require('../type/types');
const database = require('../database');
const user = require('../user/user');

const columns = {
  recruitId: {
    type: sequelize.INTEGER,
    field: 'recruit_id',
    primaryKey: true,
    autoIncrement: true,
  },
  clientId: {
    type: sequelize.INTEGER,
    field: 'client_id',
    references: {
      model: user,
      key: 'user_id',
    },
  },
  clientName: {
    type: sequelize.STRING(100),
    field: 'client_name',
  },
  actorId: {
    type: sequelize.INTEGER,
    field: 'actor_id',
    allowNull: true,
  },
  actorName: {
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
  bidCount: {
    type: sequelize.INTEGER,
    field: 'bid_count',
    defaultValue: 0,
  },
  biddingId: {
    type: sequelize.INTEGER,
    field: 'bidding_id',
    allowNull: true,
  },
  versionCount: {
    type: sequelize.INTEGER,
    field: 'version_count',
    defaultValue: 0,
  },
  currentVersion: {
    type: sequelize.INTEGER,
    field: 'current_version',
    defaultValue: 0,
  },
  processDueDate: {
    type: sequelize.DATE,
    field: 'process_due_date',
  },
  recruitDueDate: {
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

const recruitModel = database.define('recruits', columns, options);
recruitModel.belongsTo(user, { foreignKey: 'client_id' });

module.exports = recruitModel;
