const database = require('../models/database');
const recruitModel = require('../models/recruit/recruit');
const paragraphModel = require('../models/recruit/paragraph');
const { isBlank, isValidPageParameters, isScriptsReadableForActor } = require('../validation/validation');

exports.getRecruitList = (req, res) => {
  const { from, size } = req.params;

  if (isValidPageParameters(from, size) === false) {
    res.status(412).json({
      message: '파라미터가 부적합합니다.',
    });
    return;
  }

  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = from === undefined ? 0 : Number(from);
  const limit = size === undefined ? 50 : Number(size);

  recruitModel
    .findAndCountAll({
      where: { active: true },
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
};

exports.searchRecruits = (req, res) => {
  const { from, size, query } = req.query;

  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = from === undefined ? 0 : Number(from);
  const limit = size === undefined ? 50 : Number(size);

  recruitModel
    .findAndCountAll({
      where: {
        query,
      },
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
};

exports.getRecruitDetail = (req, res) => {
  recruitModel
    .findOne({
      where: { recruit_id: req.params.id },
      attributes: [
        'recruit_id', 'title', 'amount', 'created_at',
        'category', 'mood', 'recruit_due_date', 'process_due_date',
        'bid_count', 'state', 'client_id', 'client_name',
      ],
    })
    .then((retrieved) => {
      if (retrieved === null) {
        res.status(404).json({
          message: '구인 정보를 찾지 못했습니다.',
        });
      } else {
        res.json(retrieved);
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 정보 조회에 실패했습니다.',
      });
    });
};

exports.getRecruitBody = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
    return;
  }

  const { userId } = req.session.user;
  const { id } = req.params;

  recruitModel
    .findOne({
      where: { recruit_id: id },
      attributes: ['client_id', 'actor_id'],
    })
    .then((retrieved) => {
      if (retrieved.client_id === userId || (retrieved.actor_id === userId && isScriptsReadableForActor(retrieved.state))) {
        const response = {
          message: '구인 상세 정보 조회에 성공했습니다.',
          paragraphs: [],
        };

        paragraphModel
          .findAll({
            where: { recruit_id: id },
          })
          .then((paragraphs) => {
            response.paragraphs = paragraphs;
            res.json(response);
          })
          .catch(() => {
            res.status(400).json({
              message: '구인 상세 정보 조회에 실패했습니다.',
            });
          });
      } else {
        res.status(403).json({
          message: '채택된 성우와 요청자만 볼 수 있습니다.',
        });
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 상세 정보 조회에 실패했습니다.',
      });
    });
};

exports.getRecruitSample = (req, res) => {
  recruitModel
    .findOne({
      where: { recruit_id: req.params.id },
      attributes: ['sample'],
    })
    .then((retrieved) => {
      if (retrieved === null) {
        res.status(404).json({
          message: '구인 정보를 찾지 못했습니다.',
        });
      } else {
        res.json({
          message: '구인 상세 정보 조회에 성공했습니다.',
          sample: retrieved.sample,
        });
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 상세 정보 조회에 실패했습니다.',
      });
    });
};

exports.createRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 작성할 수 있습니다.',
    });
  } else if (req.session.user.type !== 'CLIENT') {
    res.status(403).json({
      message: '성우는 구인 정보를 작성할 수 없습니다.',
    });
  } else {
    const recruitDueDate = Date.now() + (1000 * 60 * 60 * 24 * req.body.recruit_duration);
    const processDueDate = recruitDueDate + (1000 * 60 * 60 * 24 * req.body.process_duration);
    const {
      title, description, category, mood, amount, sample, script,
    } = req.body;

    // 검증
    if (!Number.isInteger(amount) || Number(amount) <= 0 ||
        isBlank(title) || title.length > 150 || isBlank(description) || title.length > 1000 ||
        isBlank(sample) || sample.length > 1000 || isBlank(script) || script.length > 8000) {
      res.status(412).json({
        message: '파라미터가 부적합합니다.',
      });

      return;
    }

    const recruitAttributes = {
      client_id: req.session.user.userId,
      client_name: req.session.user.name,
      title,
      description,
      category,
      mood,
      amount: Number(amount) * 10000,
      process_due_date: processDueDate,
      recruit_due_date: recruitDueDate,
      sample,
    };

    database
      .transaction()
      .then((transaction) => {
        recruitModel
          .create(recruitAttributes, { transaction })
          .then((created) => {
            const paragraphs = script.split('\n\n');
            const paragraphAttributes = paragraphs.map((paragraph, index) => ({
              recruit_id: created.recruit_id,
              paragraph_number: index + 1,
              content: paragraph,
            }));

            paragraphModel
              .bulkCreate(paragraphAttributes, { transaction })
              .then(() => {
                transaction.commit();

                res.status(201).json({
                  message: '구인 정보 추가에 성공했습니다.',
                  detail: created,
                });
              })
              .catch(() => {
                transaction.rollback();
                res.status(400).json({
                  message: '구인 정보 추가에 실패했습니다.',
                });
              });
          })
          .catch(() => {
            transaction.rollback();
            res.status(400).json({
              message: '구인 정보 추가에 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '구인 정보 추가에 실패했습니다.',
        });
      });
  }
};

exports.cancelRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 취소할 수 있습니다.',
    });
  } else if (req.session.user.type !== 'ACTOR') {
    res.status(403).json({
      message: '구인에 참여한 성우만 취소할 수 있습니다.',
    });
  } else {
    database
      .transaction()
      .then((transaction) => {
        recruitModel
          .findOne({
            where: { recruit_id: req.params.id },
          })
          .then((retrieved) => {
            const cannotCancelState = ['WAIT_FEEDBACK', 'ON_WITHDRAW', 'DONE', 'CANCELLED'];
            if (retrieved.actor_id !== req.session.user.userId) {
              transaction.rollback();
              res.status(403).json({
                message: '구인에 참여한 성우만 취소할 수 있습니다.',
              });
            } else if (cannotCancelState.indexOf(retrieved.state) !== -1) {
              transaction.rollback();
              res.status(400).json({
                message: '요청을 취소할 수 없는 상태입니다.',
              });
            } else {
              retrieved
                .update({
                  state: 'CANCELLED',
                  active: false,
                }, { transaction })
                .then(() => {
                  transaction.commit();
                  res.status(204).send();
                })
                .catch(() => {
                  transaction.rollback();
                  res.status(400).json({
                    message: '구인 취소에 실패했습니다.',
                  });
                });
            }
          })
          .catch(() => {
            transaction.rollback();
            res.status(400).json({
              message: '구인 취소에 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '구인 취소에 실패했습니다.',
        });
      });
  }
};