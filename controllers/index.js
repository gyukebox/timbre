const recruitModel = require('../models/recruit/recruit');

exports.getRandomRecruit = (req, res) => {
  const attributes = ['recruit_id', 'title', 'amount', 'category',
    'mood', 'recruit_due_date', 'process_due_date'];
  recruitModel
    .findAndCountAll({
      attributes,
    })
    .then((retrieved) => {
      const max = retrieved.count;
      const random = Math.floor(Math.random() * max);
      res.json(retrieved.rows[random]);
    })
    .catch((err) => {
      res.status(400).json({
        message: '랜덤 구인 정보 조회에 실패했습니다.',
        detail: err,
      });
    });
};

exports.getChartInfo = (req, res) => {
  const { query } = req;
  const attributes = ['recruit_id', 'title', 'amount', 'category',
    'mood', 'recruit_due_date', 'process_due_date'];
  const response = {};

  query.active = true;

  recruitModel
    .findAll({
      where: query,
      attributes,
      order: [['amount', 'DESC']],
    })
    .then((retrieved) => {
      response.prize = retrieved;
    })
    .catch((err) => {
      res.status(400).json({
        message: '차트 정보 조회에 실패했습니다.',
        detail: err,
      });
    });

  recruitModel
    .findAll({
      where: { active: true },
      attributes,
      order: [['created_at', 'DESC']],
    })
    .then((retrieved) => {
      response.recent = retrieved;
    })
    .catch((err) => {
      res.status(400).json({
        message: '차트 정보 조회에 실패했습니다.',
        detail: err,
      });
    });

  recruitModel
    .findAll({
      where: { active: true },
      attributes,
      order: [['recruit_due_date']],
    })
    .then((retrieved) => {
      response.immediate = retrieved;
      res.json(response);
    })
    .catch((err) => {
      res.status(400).json({
        message: '차트 정보 조회에 실패했습니다.',
        detail: err,
      });
    });
};

