const userModel = require('../models/user/user');

exports.getProfile = (req, res) => {
  userModel
    .findOne({
      where: {
        userId: req.params.id,
      },
      attributes: ['userId', 'name', 'introduction'],
    })
    .then((result) => {
      if (result === null) {
        res.status(404).json({
          message: '사용자를 찾을 수 없습니다',
        });
      } else {
        res.json(result);
      }
    });
};

exports.getProfileImage = (req, res) => {
  userModel
    .findOne({
      where: { userId: req.params.id },
      attributes: ['profile'],
    })
    .then((result) => {
      if (result === null) {
        res.status(404).json({
          message: '사용자를 찾을 수 없습니다',
        });
      } else {
        res.json(result);
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: '프로필 조회에 실패했습니다',
      });
    });
};

exports.editProfileImage = (req, res) => {
  if (req.session.user === null || req.session.user === undefined) {
    res.status(403).json({
      message: '로그인이 필요합니다.',
    });
  } else if (req.session.user.userId.toString() !== req.params.id) {
    res.status(403).json({
      message: '프로필을 변경할 수 있는 권한이 없습니다.',
    });
  } else {
    userModel
      .findOne({
        where: { userId: req.params.id },
      })
      .then((user) => {
        if (user === null) {
          res.status(404).json({
            message: '사용자를 찾을 수 없습니다.',
          });
        } else {
          user
            .update({ profile: req.file === undefined ? null : req.file.path })
            .then(() => {
              res.status(204).json({
                message: '프로필을 성공적으로 변경했습니다.',
              });
            });
        }
      });
  }
};

exports.editIntroduction = (req, res) => {
  if (req.body.introduction === undefined) {
    res.status(412).json({
      message: '파라미터가 부족합니다',
    });
  } else if (req.session.user === null || req.session.user === undefined) {
    res.status(401).json({
      message: '로그인이 필요합니다.',
    });
  } else if (req.session.user.userId.toString() !== req.params.id) {
    res.status(403).json({
      message: '본인의 소개 내용만 변경 가능합니다',
    });
  } else {
    userModel
      .findOne({
        where: { userId: req.params.id },
        attributes: ['userId', 'introduction'],
      })
      .then((user) => {
        user
          .update({ introduction: req.body.introduction })
          .then(() => {
            res.status(204).json({
              message: '소개를 변경하는데 성공했습니다',
            });
          });
      })
      .catch((err) => {
        res.status(400).json({
          message: '소개를 변경하는데 실패했습니다',
          detail: err,
        });
      });
  }
};

exports.getRecruits = (req, res) => {
  res.json({
    status: 'not implemented!',
  });
};

