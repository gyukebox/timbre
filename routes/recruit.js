const express = require('express');
const path = require('path');
const multer = require('multer');
const recruit = require('../controllers/recruit');

const router = express.Router();

// maybe not needed?
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, path.join(path.join(path.dirname(__dirname), '/public'), '/recruits'));
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    },
  }),
});

router.get('/', recruit.getRecruitList);
router.get('/search', recruit.searchRecruits);
router.get('/:id', recruit.getRecruitDetail);
router.get('/:id/scripts', recruit.getRecruitBody);
router.get('/:id/samples', recruit.getRecruitSample);

router.post('/', recruit.createRecruit);
router.post('/:id/cancel', recruit.cancelRecruit);

module.exports = router;
