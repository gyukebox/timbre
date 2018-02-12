const sequelize = require('sequelize');
const database = require('../../database');
const recruit = require('../../recruit/recruit');

const columns = {
  recruit_id: {
    type: sequelize.INTEGER,
    field: 'recruit_id',
    primaryKey: true,
    references: {
      model: recruit,
      key: 'recruit_id',
    },
  },
  version: {
    type: sequelize.INTEGER,
    field: 'version',
    primaryKey: true,
    allowNull: false,
  },
  feedback_content: {
    type: sequelize.STRING(2000),
    field: 'feedback_content',
    allowNull: true,
  },
};

const options = {
  tableName: 'versions',
  freezeTableName: true,
  underscored: true,
  timestamps: false,
};

const versionModel = database.define('versions', columns, options);
versionModel.belongsTo(recruit, { foreignKey: 'recruit_id' });

module.exports = versionModel;
