const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    current: 'API ROUTE',
  });
});

module.exports = router;
