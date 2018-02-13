const sequelize = require('sequelize');
const database = require('../../../database');
const recruit = require('../../../recruit/recruit');

const columns = {
  recruitId: {
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
  paragraphNumber: {
    type: sequelize.INTEGER,
    field: 'paragraph_number',
    primaryKey: true,
    allowNull: false,
  },
  fileUrl: {
    type: sequelize.STRING(300),
    field: 'file_url',
    allowNull: false,
  },
  fileLength: {
    type: sequelize.INTEGER,
    field: 'file_length',
    allowNull: false,
  },
};

const options = {
  tableName: 'recordings',
  freezeTableName: true,
  underscored: true,
  timestamps: false,
};

const versionModel = database.define('recordings', columns, options);

module.exports = versionModel;
