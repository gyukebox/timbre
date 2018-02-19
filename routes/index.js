const express = require('express');
const account = require('../controllers/accountManagement');
const pay = require('../controllers/pay');
const main = require('../controllers/index');

const router = express.Router();

router.get('/random', main.getRandomRecruit);
router.get('/chart', main.getChartInfo);
router.get('/auth', account.verifyEmail);
router.get('/banks', pay.getBankList);
router.get('/profits', pay.getProfits);
router.put('/account', pay.putBankAccount);

module.exports = router;
