const express = require('express');
const account = require('../controllers/accountManagement');
const main = require('../controllers/index');

const router = express.Router();

router.get('/random', main.getRandomRecruit);
router.get('/chart', main.getChartInfo);
router.get('/auth', account.verifyEmail);

module.exports = router;
