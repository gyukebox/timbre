const express = require('express');
const path = require('path');
const uuid = require('uuid/v4');
const multer = require('multer');
const recruit = require('../controllers/recruit');
const bidding = require('../controllers/bidding');

const router = express.Router();
const extentionPattern = /(?:\.([^.]+))?$/;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, path.join(__dirname, '../public', '/biddings'));
    },
    filename: (req, file, callback) => {
      const filename = uuid();
      const extension = extentionPattern.exec(file.originalname)[1];
      callback(null, `${filename}.${extension}`);
    },
  }),
});

router.get('/', recruit.getRecruitList);
router.get('/search', recruit.searchRecruits);
router.get('/:id', recruit.getRecruitDetail);
router.get('/:id/scripts', recruit.getRecruitBody);
router.get('/:id/samples', recruit.getRecruitSample);
router.get('/:id/bids', bidding.getRecruitBiddings);

router.post('/', recruit.createRecruit);
router.post('/:id/cancel', recruit.cancelRecruit);
router.post('/:id/bids', upload.single('sample'), bidding.createBidding);

module.exports = router;
