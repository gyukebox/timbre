const sequelize = require('sequelize');
const userModel = require('../models/user/user');
const recruitModel = require('../models/recruit/recruit');
const { isValidStatus, isValidPageParameters } = require('../validation/validation');
const { statusGroups } = require('../enum/enum');

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
          message: '사용자를 찾을 수 없습니다.',
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
          message: '사용자를 찾을 수 없습니다.',
        });
      } else if (result.profile === undefined || result.profile === null) {
        res.status(204).send();
      } else {
        res.sendFile(result.profile);
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '프로필 조회에 실패했습니다.',
      });
    });
};

exports.editProfileImage = (req, res) => {
  if (req.session.user === null || req.session.user === undefined) {
    res.status(401).json({
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
            })
            .catch(() => {
              res.status(400).json({
                message: '프로필을 변경하는데 실패했습니다.',
              });
            });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '프로필을 변경하는데 실패했습니다.',
        });
      });
  }
};

exports.editIntroduction = (req, res) => {
  const { introduction } = req.body;

  if (introduction === undefined || introduction === null || introduction.length <= 0) {
    res.status(412).json({
      message: '파라미터가 부적합합니다.',
    });
  } else if (req.session.user === null || req.session.user === undefined) {
    res.status(401).json({
      message: '로그인이 필요합니다.',
    });
  } else if (req.session.user.userId.toString() !== req.params.id) {
    res.status(403).json({
      message: '본인의 소개 내용만 변경 가능합니다.',
    });
  } else {
    userModel
      .findOne({
        where: { userId: req.params.id },
        attributes: ['userId', 'introduction'],
      })
      .then((user) => {
        user
          .update({
            introduction: req.body.introduction,
          })
          .then(() => {
            res.status(204).json({
              message: '소개를 변경하는데 성공했습니다.',
            });
          })
          .catch(() => {
            res.status(400).json({
              message: '소개를 변경하는데 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '소개를 변경하는데 실패했습니다.',
        });
      });
  }
};

const checkAndDoWithPagination = (req, res, type) => {
  const { status, from, size } = req.query;

  if (req.session.user === null || req.session.user === undefined) {
    res.status(401).json({
      message: '로그인이 필요합니다.',
    });
  } else if (req.session.user.type !== type) {
    res.status(403).json({
      message: '조회 불가능한 유형의 계정입니다.',
    });
  } else if (isValidStatus(status) === false || isValidPageParameters(from, size) === false) {
    res.status(412).json({
      message: '파라미터가 부적합합니다.',
    });
  } else {
    const statusGroup = statusGroups[status];
    const order = [['recruit_id', 'DESC']];
    const offset = from === undefined ? 0 : Number(from);
    const limit = size === undefined ? 50 : Number(size);
    const { userId } = req.session.user;

    const attributes = [
      'recruit_id', 'title', 'amount', 'created_at',
      'category', 'mood', 'recruit_due_date', 'process_due_date',
      'bid_count', 'state', 'client_id', 'client_name',
    ];

    const query = {
      active: true,
      state: {
        [sequelize.Op.or]: statusGroup,
      },
    };

    if (type === 'ACTOR') {
      query.actor_id = userId;
    } else {
      query.client_id = userId;
    }

    recruitModel
      .findAndCountAll({
        where: query,
        attributes,
        order,
        offset,
        limit,
      })
      .then((retrieved) => {
        const total = retrieved.count;
        const response = {
          pages: {
            total,
            from: offset,
            size: retrieved.rows.length,
            has_next: (total > offset + limit),
          },
          recruits: retrieved.rows,
        };
        res.json(response);
      })
      .catch(() => {
        res.status(400).json({
          message: '구인 목록 조회에 실패했습니다.',
        });
      });
  }
};

exports.getRecruits = (req, res) => {
  checkAndDoWithPagination(req, res, 'CLIENT');
};


exports.getBiddings = (req, res) => {
  checkAndDoWithPagination(req, res, 'ACTOR');
};

