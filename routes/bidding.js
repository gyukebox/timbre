const express = require('express');
const bidding = require('../controllers/bidding');

const router = express.Router();

router.get('/:id/sample', bidding.getSampleFile);
router.post('/:id/accept', bidding.acceptBidding);

module.exports = router;
