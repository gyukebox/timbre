/* eslint-disable camelcase */
const accountModel = require('../models/user/account');
const { bankTypes } = require('../enum/enum');
const { isBlank } = require('../validation/validation');

exports.getBankList = (req, res) => {
  res.json(bankTypes);
};

exports.putBankAccount = (req, res) => {
  const { bank_type, bank_account } = req.body;

  if (bankTypes.indexOf(bank_type) === -1) {
    res.status(412).json({
      message: '은행 정보가 올바르지 않습니다.',
    });
  } else if (isBlank(bank_account)) {
    res.status(412).json({
      message: '계좌 정보가 올바르지 않습니다.',
    });
  } else if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 접근 가능합니다.',
    });
  } else {
    const { userId } = req.session.user;

    accountModel
      .findOne({
        where: {
          userId,
        },
      })
      .then((account) => {
        if (!account) {
          res.status(404).json({
            message: '계정 정보 조회에 실패했습니다.',
          });
        } else {
          account
            .update({
              bankType: bank_type,
              bankAccount: bank_account,
            })
            .then(() => {
              res.status(200).json({
                message: '계좌 정보 변경에 성공했습니다.',
              });
            })
            .catch(() => {
              res.status(400).json({
                message: '계좌 정보 변경에 실패했습니다.',
              });
            });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '계정 정보 변경에 실패했습니다.',
        });
      });
  }
};
