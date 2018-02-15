const duration = require('mp3-duration');
const database = require('../models/database');
const bidModel = require('../models/recruit/bidding');
const recruitModel = require('../models/recruit/recruit');
const versionModel = require('../models/recruit/version/version');
const { isValidPageParameters, isBiddingAcceptableState } = require('../validation/validation');

const buildBiddingsApiResult = item => ({
  bidding_id: item.bidding_id,
  recruit_id: item.recruit_id,
  created: item.created_at,
  client: {
    actor_id: item.actor_id,
    username: item.user_name,
  },
});

exports.getRecruitBiddings = (req, res) => {
  const { from, size } = req.params;

  if (isValidPageParameters(from, size) === false) {
    res.status(412).json({
      message: '파라미터가 부적합합니다.',
    });
    return;
  }

  const attributes = ['recruit_id', 'bidding_id', 'created_at', 'actor_id', 'user_name'];
  const order = [['bidding_id', 'DESC']];
  const offset = from === undefined ? 0 : Number(from);
  const limit = size === undefined ? 50 : Number(size);

  bidModel
    .findAndCountAll({
      attributes,
      where: {
        recruit_id: req.params.id,
      },
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
        bids: retrieved.rows.map(buildBiddingsApiResult),
      };
      res.json(response);
    })
    .catch(() => {
      res.status(400).json({
        message: '입찰 정보를 조회하는데 실패했습니다.',
      });
    });
};

exports.acceptBidding = (req, res) => {
  database
    .transaction()
    .then((transaction) => {
      bidModel
        .findById(req.params.id)
        .then((bid) => {
          recruitModel
            .findOne({
              where: {
                active: true,
                recruitId: bid.recruitId,
              },
            })
            .then((recruit) => {
              if (!recruit || isBiddingAcceptableState(recruit.state) === false) {
                transaction.rollback();
                res.status(400).json({
                  message: '입찰에 실패했습니다.',
                });
              } else if (recruit.client_id !== req.session.user.userId) {
                transaction.rollback();
                res.status(403).json({
                  message: '입찰 수락은 요청자만 할 수 있습니다.',
                });
              } else {
                recruit
                  .update({
                    actorId: bid.actorId,
                    actorName: bid.userName,
                    state: 'WAIT_PROCESS',
                    currentVersion: 1,
                  }, { transaction })
                  .then(() => {
                    const attributes = {
                      recruitId: recruit.recruitId,
                      version: 1,
                      createdAt: Date.now(),
                    };
                    versionModel
                      .create(attributes, { transaction })
                      .then(() => {
                        transaction.commit();
                        res.status(200).json({
                          message: '입찰에 성공했습니다.',
                        });
                      })
                      .catch(() => {
                        transaction.rollback();
                        res.status(400).json({
                          message: '입찰에 실패했습니다.',
                        });
                      });
                  })
                  .catch(() => {
                    transaction.rollback();
                    res.status(400).json({
                      message: '입찰에 실패했습니다.',
                    });
                  });
              }
            })
            .catch(() => {
              transaction.rollback();
              res.status(400).json({
                message: '입찰에 실패했습니다.',
              });
            });
        })
        .catch(() => {
          transaction.rollback();
          res.status(400).json({
            message: '입찰에 실패했습니다.',
          });
        });
    })
    .catch(() => {
      res.status(400).json({
        message: '입찰에 실패했습니다.',
      });
    });
};

exports.createBidding = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인 한 사용자만 입찰에 참여할 수 있습니다.',
    });
    return;
  }

  const { id } = req.params;
  const { title, description } = req.body;
  const { path } = req.file;
  const { userId, type, name } = req.session.user;

  if (type !== 'ACTOR') {
    res.status(403).json({
      message: '요청자는 입찰에 참여할 수 없습니다.',
    });
    return;
  }

  database
    .transaction()
    .then((transaction) => {
      recruitModel
        .findOne({
          where: {
            recruitId: id,
          },
        })
        .then((recruit) => {
          // 입찰 진행 중이 아닐 경우 예외 처리
          if (recruit === undefined || recruit === null || recruit.state !== 'ON_BIDDINGS') {
            res.status(400).json({
              message: '입찰 가능한 상태가 아닙니다.',
            });
            return;
          }
          bidModel
            .findOne({
              where: {
                actorId: userId,
              },
            })
            .then((bid) => {
              // 성우가 참여한 정보가 없다면 입찰 정보 추가
              if (!bid) {
                duration(path, (err, length) => {
                  if (length <= 3) {
                    res.status(412).json({
                      message: '3초 이하의 파일은 올릴 수 없습니다.',
                    });
                  } else if (err) {
                    transaction.rollback();
                    res.status(400).json({
                      message: '입찰 정보 등록에 실패했습니다.',
                    });
                  } else {
                    const attributes = {
                      actorId: userId,
                      recruitId: recruit.recruitId,
                      username: name,
                      title,
                      description,
                      sampleFileUrl: path,
                      sampleFileLength: length,
                    };

                    bidModel
                      .create(attributes, { transaction })
                      .then(() => {
                        // TODO : 알림 추가
                        transaction.commit();
                        res.status(201).json({
                          message: '입찰 정보를 성공적으로 등록했습니다.',
                        });
                      })
                      .catch(() => {
                        transaction.rollback();
                        res.status(400).json({
                          message: '입찰 정보 등록에 실패했습니다.',
                        });
                      });
                  }
                });
              } else {
                transaction.rollback();
                res.status(409).json({
                  message: '입찰 정보 등록에 실패했습니다.',
                });
              }
            })
            .catch(() => {
              transaction.rollback();
              res.status(400).json({
                message: '입찰 정보 등록에 실패했습니다.',
              });
            });
        })
        .catch(() => {
          transaction.rollback();
          res.status(400).json({
            message: '입찰 정보 등록에 실패했습니다.',
          });
        });
    })
    .catch(() => {
      res.status(400).json({
        message: '입찰 정보 등록에 실패했습니다.',
      });
    });
};

exports.getSampleFile = (req, res) => {
  bidModel
    .findOne(req.params.id)
    .then((bid) => {
      if (!bid) {
        res.status(404).json({
          message: '입찰 정보를 찾을 수 없습니다.',
        });
      } else {
        res.sendFile(bid.sample_file_url);
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '입찰 음원 정보를 읽는데 실패했습니다.',
      });
    });
};
