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
  createdAt: {
    type: sequelize.DATE,
    field: 'created_at',
    primaryKey: true,
    allowNull: false,
  },
  feedbackContent: {
    type: sequelize.STRING(2000),
    field: 'feedback_content',
    allowNull: false,
  },
  feedbackPoint: {
    type: sequelize.INTEGER,
    field: 'feedback_point',
    allowNull: false,
  },
};

const options = {
  tableName: 'recording_feedbacks',
  freezeTableName: true,
  underscored: true,
  timestamps: false,
};

const feedbackModels = database.define('recording_feedbacks', columns, options);

module.exports = feedbackModels;
