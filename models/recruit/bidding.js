const sequelize = require('sequelize');
const database = require('../database');
const recruit = require('../recruit/recruit');
const user = require('../user/user');

const columns = {
  biddingId: {
    type: sequelize.INTEGER,
    field: 'bidding_id',
    primaryKey: true,
    autoIncrement: true,
  },
  actorId: {
    type: sequelize.INTEGER,
    field: 'actor_id',
    references: {
      model: user,
      key: 'user_id',
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
  username: {
    type: sequelize.STRING(100),
    field: 'user_name',
    allowNull: false,
  },
  title: {
    type: sequelize.STRING(200),
    field: 'title',
    allowNull: true,
  },
  description: {
    type: sequelize.STRING(2000),
    field: 'description',
    allowNull: true,
  },
  sampleFileUrl: {
    type: sequelize.STRING(300),
    field: 'sample_file_url',
    allowNull: false,
  },
  sampleFileLength: {
    type: sequelize.INTEGER,
    field: 'sample_file_length',
    allowNull: false,
  },
};

const options = {
  tableName: 'biddings',
  freezeTableName: true,
  underscored: true,
};

const bidModel = database.define('biddings', columns, options);

bidModel.belongsTo(recruit, { foreignKey: 'recruit_id' });
bidModel.belongsTo(user, { foreignKey: 'actor_id' });

module.exports = bidModel;
