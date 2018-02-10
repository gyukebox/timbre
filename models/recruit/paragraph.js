const sequelize = require('sequelize');
const database = require('../database');
const recruit = require('../recruit/recruit');

const columns = {
  recruit_id: {
    type: sequelize.INTEGER,
    field: 'recruit_id',
    references: {
      model: recruit,
      key: 'recruit_id',
    },
  },
  paragraph_number: {
    type: sequelize.INTEGER,
    field: 'paragraph_number',
    allowNull: false,
  },
  content: {
    type: sequelize.STRINT(2000),
    field: 'content',
    allowNull: false,
  },
};

const options = {
  tableName: 'paragraphs',
  freezeTableName: true,
  underscored: true,
};

const paragraphModel = database.define('paragraphs', columns, options);
paragraphModel.belongsTo(recruit, { foreignKey: 'recruit_id' });

module.exports = paragraphModel;
