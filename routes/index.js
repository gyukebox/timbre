const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.json({
    branch: [
      {
        name: 'master',
        message: 'Hello world from Node.js and Elastic Beanstalk!',
      },
      {
        name: 'gyu',
        message: 'Sample commit from gyu',
      },
    ],
  });
});

module.exports = router;
