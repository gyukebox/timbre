const express = require('express');
const account = require('../controllers/accountManagement');
const profile = require('../controllers/profile');
const { profiles } = require('../resources/index').storages;

const router = express.Router();

// 계정 관리
router.post('/join', profiles.single('profile'), account.join);
router.post('/login', account.login);
router.post('/logout', account.logout);
router.post('/change_password', account.changePassword);

// 프로필
router.get('/:id', profile.getProfile);
router.get('/:id/profile', profile.getProfileImage);
router.put('/:id/profile', profiles.single('profile'), profile.editProfileImage);
router.put('/:id/introduction', profile.editIntroduction);
router.get('/:id/recruits', profile.getRecruits);
router.get('/:id/biddings', profile.getBiddings);

module.exports = router;
