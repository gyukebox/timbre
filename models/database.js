const Sequelize = require('sequelize');

const { database } = require('../resources');

const option = {
  host: database.hostname,
  dialect: database.dialect,
  pool: database.pool,
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
};

module.exports = new Sequelize(database.schema, database.username, database.password, option);
