const express = require('express');
const main = require('../controllers/index');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    current: 'API ROUTE',
  });
});

router.get('/random', main.getRandomRecruit);
router.get('/chart', main.getChartInfo);

module.exports = router;
