const recruitModel = require('../models/recruit/recruit');

exports.getRandomRecruit = (req, res) => {
  const attributes = ['recruit_id', 'title', 'amount', 'category',
    'mood', 'recruit_due_date', 'process_due_date'];
  recruitModel
    .max('recruit_id')
    .then((max) => {
      const randomId = Math.floor(Math.random() * max) + 1;
      recruitModel
        .findOne({
          where: { recruit_id: randomId },
          attributes,
        })
        .then((retrieved) => {
          res.json(retrieved);
        })
        .catch(() => {
          res.status(400).json({
            message: '랜덤 구인 정보 조회에 실패했습니다.',
          });
        });
    })
    .catch(() => {
      res.status(400).json({
        message: '랜덤 구인 정보 조회에 실패했습니다.',
      });
    });
};

const categories = ['narration', 'dubbing', 'book', 'advertisement', 'ars', 'etc'];

exports.getChartInfo = (req, res) => {
  const response = {};
  const { active, category } = req.query;
  const attributes = ['recruit_id', 'title', 'amount', 'category', 'mood', 'recruit_due_date', 'process_due_date'];

  const query = {
    active,
  };

  if (category !== undefined && category !== null) {
    if (categories.indexOf(category) > -1) {
      query.category = category;
    } else {
      res.status(412).json({
        message: '파라미터가 부적합합니다.',
      });
      return;
    }
  }

  const mostExpensiveRecruits = recruitModel
    .findAll({
      where: { active: true },
      attributes,
      order: [['amount', 'DESC']],
    });

  const mostRecentRecruits = recruitModel
    .findAll({
      where: { active: true },
      attributes,
      order: [['created_at', 'DESC']],
    });

  const mostImmediateRecruits = recruitModel
    .findAll({
      where: { active: true },
      attributes,
      order: [['recruit_due_date']],
    });

  Promise
    .all([mostExpensiveRecruits, mostRecentRecruits, mostImmediateRecruits])
    .then((retrieved) => {
      [response.prize, response.recent, response.immediate] = retrieved;
      res.json(response);
    })
    .catch((err) => {
      res.status(400).json({
        message: '차트 정보 조회에 실패했습니다.',
        detail: err,
      });
    });
};

