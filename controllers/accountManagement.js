const sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const uuid = require('uuid/v4');
const database = require('../models/database');
const userModel = require('../models/user/user');
const accountModel = require('../models/user/account');
const { host } = require('../resources/index');

exports.join = (req, res) => {
  userModel
    .findOne({
      where: {
        [sequelize.Op.or]: {
          mail: req.body.mail,
          name: req.body.username,
        },
      },
    })
    .then((result) => {
      if (result !== null) {
        res.status(409).json({ message: '해당 이메일이나 닉네임으로 이미 가입된 정보가 있습니다.', detail: result });
      } else {
        database
          .transaction()
          .then((transaction) => {
            const userProperties = {
              name: req.body.username,
              mail: req.body.mail,
              type: req.body.type,
              profile: req.file === undefined ? null : req.file.path,
            };

            userModel
              .create(userProperties, { transaction })
              .then((user) => {
                const newAccountProperties = {
                  userId: user.userId,
                  // TODO encode password
                  password: req.body.password,
                };

                accountModel
                  .create(newAccountProperties, { transaction })
                  .then((account) => {
                    transaction.commit();
                    res.status(201).json({ message: '회원가입에 성공했습니다!', user, account });
                  })
                  .catch(sequelize.ValidationError, (err) => {
                    transaction.rollback();
                    res.status(412).json({ message: '회원가입 조건을 만족하지 않습니다.', detail: err });
                  })
                  .catch((err) => {
                    transaction.rollback();
                    res.status(400).json({ message: '알 수 없는 예외가 발생했습니다.', detail: err });
                  });
              })

              .catch(sequelize.ValidationError, (err) => {
                transaction.rollback();
                res.status(412).json({ message: '회원가입 조건을 만족하지 않습니다.', detail: err });
              })

              .catch((err) => {
                transaction.rollback();
                res.status(400).json({ message: '알 수 없는 예외가 발생했습니다.', detail: err });
              });
          });
      }
    });
};

exports.login = (req, res) => {
  userModel
    .findOne({
      where: {
        mail: req.body.mail,
      },
      attributes: ['userId', 'name', 'mail', 'type'],
      include: [{
        model: accountModel,
        // TODO encode request-password or decode saved password
        where: {
          password: req.body.password,
        },
        attributes: ['userId', 'password'],
      }],
    })
    .then((user) => {
      if (user === null) {
        res.status(412).send('로그인 정보가 올바르지 않습니다');
      } else {
        req.session.user = user;
        res.status(201).json({
          message: '로그인에 성공했습니다',
          user,
        });
      }
    })
    .catch((err) => {
      res.status(401).json({
        message: '로그인에 실패했습니다',
        detail: err,
      });
    });
};

exports.logout = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(400).send('로그아웃에 실패했습니다');
  } else {
    req.session.user = undefined;
    res.status(204).send('로그아웃에 성공했습니다');
  }
};

exports.changePassword = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).send('로그인이 필요합니다.');
  } else {
    accountModel
      .findOne({
        where: {
          userId: req.session.user.userId,
        },
      })
      .then((account) => {
        // TODO encode password
        account.update({
          password: req.body.password,
        })
          .then((result) => {
            res.status(204).json({
              message: '비밀번호 변경에 성공했습니다',
              user: result,
            });
          });
      })
      .catch((err) => {
        res.status(400).send({
          message: '비밀번호 변경에 실패했습니다',
          detail: err,
        });
      });
  }
};

exports.sendVerificationMail = (req, res) => {
  const token = uuid();
  userModel
    .findOne({
      where: {
        userId: req.params.id,
      },
    })
    .then((user) => {
      if (user === null) {
        req.status(404).send('사용자를 찾을 수 없습니다.');
      } else {
        const validationToken = {
          token,
          expiry: Date.now() + (1000 * 60 * 60),
        };
        user.update(validationToken);
      }
    });

  const message = {
    from: 'timbredeveloper@gmail.com',
    to: req.body.mail,
    subject: 'Authentication email',
    html: `<h2>다음 링크로 들어가 이메일 인증을 완료하세요!</h2> <a href="http://${host}/users/${req.params.id}/auth_email?token=${token}">이메일 인증하기</a>`,
  };
  const smtp = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'timbredeveloper@gmail.com',
      pass: 'AWEs0m2Developer@',
    },
  });

  smtp.sendMail(message, (err, info) => {
    if (err) {
      res.status(400).json({
        message: '인증 메일을 보내는 데 실패하였습니다.',
        detail: err,
      });
    } else {
      res.json({
        message: '인증 메일을 성공적으로 보냈습니다.',
        detail: info.envelope,
      });
    }
  });
};

exports.verifyEmail = (req, res) => {
  userModel
    .findOne({
      attributes: ['token', 'expiry'],
      where: { userId: req.params.id },
    })
    .then((user) => {
      if (req.query.token !== user.token) {
        res.status(400).json({ message: '인증에 실패하였습니다' });
      } else if (Date(user.expiry) < Date.now()) {
        res.status(400).json({ message: '인증에 실패하였습니다' });
      } else {
        res.json({ message: '인증에 성공하였습니다!' });
      }
    });
};

