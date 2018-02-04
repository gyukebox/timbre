const resources = {};

resources.database = {
  schema: 'timbre',
  dialect: 'mysql',
  hostname: 'localhost',
  username: 'timbre',
  password: 'password',
};

resources.cache = {
  host: '127.0.0.1',
};

module.exports = resources;
