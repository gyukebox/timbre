const process = require('process');

const dev = require('../resources/dev');
const real = require('../resources/real');

const resources = Object.assign({}, process.env.ENV_VARIABLE === 'dev' ? dev : real);

resources.database.pool = {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

// TODO : 공통 프로퍼티 추가

module.exports = resources;
