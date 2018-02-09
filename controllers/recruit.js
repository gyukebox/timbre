const sequelize = require('sequelize');
const database = require('../models/database');
const recruitModel = require('../models/recruit/recruit');

exports.getRecruitList = (req, res) => {
  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = req.query.from === undefined ? 0 : Number(req.query.from);
  const limit = req.query.size === undefined ? 50 : Number(req.query.size);

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
    .catch((err) => {
      res.status(400).json({
        message: '구인 목록 조회에 실패했습니다.',
        detail: err,
      });
    });
};

exports.searchRecruits = (req, res) => {
  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = req.query.from === undefined ? 0 : Number(req.query.from);
  const limit = req.query.size === undefined ? 50 : Number(req.query.size);

  const query = Object.assign({}, req.query);
  query.active = true;
  delete query.from;
  delete query.size;

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
    .catch((err) => {
      res.status(400).json({
        message: '구인 목록 조회에 실패했습니다.',
        detail: err,
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
        res.status(404).send('구인 정보를 찾지 못했습니다.');
      } else {
        res.json(retrieved);
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: '구인 정보 조회에 실패했습니다',
        detail: err,
      });
    });
};

exports.getRecruitBody = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).send('로그인한 사용자만 조회할 수 있습니다.');
  } else {
    recruitModel
      .findOne({
        where: { recruit_id: req.params.id },
        attributes: ['client_id', 'actor_id', 'script'],
      })
      .then((retrieved) => {
        if (retrieved.client_id === req.session.user.userId || retrieved.actor_id === req.session.userId) {
          const response = {
            message: '구인 상세 정보 조회에 성공했습니다.',
            paragraphs: [],
          };
          const paragraphs = retrieved.script.split('\n\n');
          for (let i = 0; i < paragraphs.length; i++) {
            response.paragraphs.push({
              paragraph: i + 1,
              content: paragraphs[i],
            });
          }
          res.json(response);
        } else {
          res.status(403).send('채택된 성우와 요청자만 볼 수 있습니다.');
        }
      })
      .catch((err) => {
        res.status(400).json({
          message: '구인 상세 정보 조회에 실패했습니다.',
          detail: err,
        });
      });
  }
};

exports.getRecruitSample = (req, res) => {
  recruitModel
    .findOne({
      where: { recruit_id: req.params.id },
      attributes: ['sample'],
    })
    .then((retrieved) => {
      if (retrieved === null) {
        res.status(404).send('구인 정보를 찾지 못했습니다');
      } else {
        res.json({
          message: '구인 상세 정보 조회에 성공했습니다.',
          sample: retrieved.sample,
        });
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: '구인 상세 정보 조회에 성공했습니다',
        detail: err,
      });
    });
};

exports.createRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).send('로그인한 사용자만 작성할 수 있습니다.');
  } else if (req.session.user.type !== 'CLIENT') {
    res.status(403).send('성우는 구인 정보를 작성할 수 없습니다.');
  } else {
    const recruitDueDate = Date.now() + (1000 * 60 * 60 * 24 * req.body.recruit_duration);
    const processDueDate = recruitDueDate + (1000 * 60 * 60 * 24 * req.body.process_duration);
    const recruitAttributes = {
      client_id: req.session.user.userId,
      client_name: req.session.user.name,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      mood: req.body.mood,
      amount: req.body.amount * 10000,
      process_due_date: processDueDate,
      recruit_due_date: recruitDueDate,
      sample: req.body.sample,
      script: req.body.script,
    };

    recruitModel
      .create(recruitAttributes)
      .then((created) => {
        res.status(201).json({
          message: '구인 정보 추가에 성공했습니다!',
          detail: created,
        });
      })
      .catch(sequelize.ValidationError, (err) => {
        res.status(402).json({
          message: '파라미터가 부족합니다.',
          detail: err.message,
        });
      })
      .catch((err) => {
        res.status(400).json({
          message: '구인 정보 추가에 실패했습니다.',
          detail: err.message,
        });
      });
  }
};

exports.cancelRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).send('로그인한 사용자만 취소할 수 있습니다.');
  } else if (req.session.user.type !== 'ACTOR') {
    res.status(403).send('구인에 참여한 성우만 취소할 수 있습니다.');
  } else {
    database
      .transaction()
      .then((transaction) => {
        recruitModel
          .findOne({
            where: { recruit_id: req.params.id },
          })
          .then((retrieved) => {
            const cannotCancelState = ['WAIT_FEEDBACK', 'ON_WITHDRAW', 'DONE'];
            if (retrieved.actor_id !== req.session.user.userId) {
              transaction.rollback();
              res.status(403).send('구인에 참여한 성우만 취소할 수 있습니다.');
            } else if (cannotCancelState.indexOf(retrieved.state) !== -1) {
              transaction.rollback();
              res.status(412).send('요청을 취소할 수 없는 상태입니다.');
            } else {
              transaction.commit();
              retrieved
                .update({
                  state: 'CANCELLED',
                  active: false,
                }).then((result) => {
                  res.status(204).json({
                    message: '구인 취소에 성공했습니다.',
                    detail: result,
                  });
                });
            }
          })
          .catch((err) => {
            transaction.rollback();
            res.status(400).json({
              message: '구인 취소에 실패했습니다.',
              detail: err,
            });
          });
      })
      .catch((err) => {
        res.status(400).json({
          message: '구인 취소에 실패했습니다.',
          detail: err,
        });
      });
  }
};
