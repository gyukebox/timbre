const resources = {};

resources.database = {
  schema: 'timbre',
  dialect: 'mysql',
  hostname: 'localhost',
  username: 'timbre',
  password: 'timbre_password',
};

resources.cache = {
  host: '127.0.0.1',
};

resources.host = 'localhost:3000';

module.exports = resources;
