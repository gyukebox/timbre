const redis = require('redis');
const { cache } = require('../resources');

module.exports = redis.createClient(cache);
