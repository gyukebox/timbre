const process = require('process');

const dev = require('../resources/dev');
const real = require('../resources/real');

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const winston = require('winston');

const resources = Object.assign({}, process.env.ENV_VARIABLE === 'dev' ? dev : real);

resources.database.pool = {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

// TODO : 공통 프로퍼티 추가
resources.cache = {
  detect_buffers: true,
};

resources.session = {
  store: new RedisStore(),
  key: 'sid',
  secret: 'secret',
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
  },
};

resources.logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
});

if (process.env.NODE_ENV !== 'production') {
  resources.logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = resources;
