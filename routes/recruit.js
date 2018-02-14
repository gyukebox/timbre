const express = require('express');
const recruit = require('../controllers/recruit');
const bidding = require('../controllers/bidding');
const { samples, recordings } = require('../resources/index').storages;

const router = express.Router();

router.get('/', recruit.getRecruitList);
router.get('/search', recruit.searchRecruits);
router.get('/:id', recruit.getRecruitDetail);
router.get('/:id/scripts', recruit.getRecruitBody);
router.get('/:id/samples', recruit.getRecruitSample);
router.get('/:id/bids', bidding.getRecruitBiddings);
router.get('/:id/versions', recruit.getAllVersions);
router.get('/:id/versions/current', recruit.getCurrentVersion);
router.get('/:recruit_id/versions/:version_no/paragraphs/:paragraph_no/file', recruit.getParagraphFile);
router.get('/:recruit_id/versions/:version_no/feedback', recruit.getAllFeedback);

router.post('/', recruit.createRecruit);
router.post('/:id/cancel', recruit.cancelRecruit);
router.post('/:id/bids', samples.single('sample'), bidding.createBidding);
router.post('/:recruit_id/versions/:version_no/submit', recruit.submitVersion);
router.post('/:recruit_id/versions/:version_no/paragraphs/:paragraph_no/feedback', recruit.writeFeedback);

router.put('/:recruit_id/versions/:version_no/paragraphs/:paragraph_no/file', recordings.single('recording'), recruit.putParagraphFile);

module.exports = router;