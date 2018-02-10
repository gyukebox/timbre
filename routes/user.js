const express = require('express');
const path = require('path');
const multer = require('multer');
const account = require('../controllers/accountManagement');
const profile = require('../controllers/profile');

const router = express.Router();

// file upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, path.join(path.dirname(__dirname), '/public'));
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    },
  }),
});

// root of user api
router.get('/', (req, res) => {
  res.json({
    url: '/users',
    endpoints: {
      회원가입: '/join',
      로그인: '/login',
      로그아웃: '/logout',
      '비밀번호 변경': '/change_password',
      '프로필 조회': '/{id}',
      '프로필 사진': '/{id}/profile',
      '소개 수정': '/{id}/introduction',
      '구인 조회': '/{id}/recruits',
    },
  });
});

// 계정 관리
router.post('/join', upload.single('profile'), account.join);
router.post('/login', account.login);
router.post('/logout', account.logout);
router.post('/change_password', account.changePassword);
router.get('/:id/auth_email', account.verifyEmail);

// 프로필
router.get('/:id', profile.getProfile);
router.get('/:id/profile', profile.getProfileImage);
router.put('/:id/profile', upload.single('profile'), profile.editProfileImage);
router.put('/:id/introduction', profile.editIntroduction);
router.get('/:id/recruits', profile.getRecruits);

module.exports = router;
