const session = require('express-session');
const fs = require('fs');
const path = require('path');
const process = require('process');
const multer = require('multer');
const uuid = require('uuid/v4');
const winston = require('winston');
const RedisStore = require('connect-redis')(session);

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

const createStorage = (storagePath) => {
  const extensionPattern = /(?:\.([^.]+))?$/;

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        callback(null, storagePath);
      },
      filename: (req, file, callback) => {
        const filename = uuid();
        const extension = extensionPattern.exec(file.originalname)[1];
        callback(null, `${filename}.${extension}`);
      },
    }),
  });
};

resources.storages = {};

const parents = '../data';
const parentDirectory = path.join(__dirname, parents);

if (!fs.existsSync(parentDirectory)) {
  fs.mkdirSync(parentDirectory);
}

const paths = {
  profiles: '/profiles',
  samples: '/samples',
  recordings: '/recordings',
};

Object.keys(paths).forEach((key) => {
  const target = path.join(parentDirectory, paths[key]);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }
  resources.storages[key] = createStorage(target);
});

resources.logger = winston.cli();

module.exports = resources;
