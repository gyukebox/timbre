const bcrypt = require('bcrypt');
const sequelize = require('sequelize');
const uuid = require('uuid/v4');
const database = require('../models/database');
const userModel = require('../models/user/user');
const accountModel = require('../models/user/account');
const { smtp } = require('../util/mailer');
const { host } = require('../resources/index');

class ValidationError {
  constructor(message) {
    this.name = 'ValidationError';
    this.message = message;
  }
}

const validatePassword = (password) => {
  const validPattern = /(?!^[0-9]*$)(?!^[a-zA-Z]*$)^([a-zA-Z0-9]{4,16})$/;
  if (!validPattern.test(password)) {
    throw new ValidationError('Invalid password!');
  }
};

function validateEmail(email) {
  const validPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!validPattern.test(email)) {
    throw new ValidationError('Invalid email!');
  }
}

exports.join = (req, res) => {
  // 검증
  try {
    validatePassword(req.body.password);
    validateEmail(req.body.mail);
  } catch (error) {
    res.status(412).json({ message: '회원가입 조건을 만족하지 않습니다.', detail: error.message });
    return;
  }

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
        // 인증 정보 생성
        const token = uuid();
        const expiry = Date.now() + (1000 * 60 * 60);

        database
          .transaction()
          .then((transaction) => {
            const userProperties = {
              name: req.body.username,
              mail: req.body.mail,
              type: req.body.type,
              profile: req.file === undefined ? null : req.file.path,
              token,
              expiry,
            };

            // Bcrypt를 사용한 암호화
            const salt = bcrypt.genSaltSync();
            const encoded = bcrypt.hashSync(req.body.password, salt);

            userModel
              .create(userProperties, { transaction })
              .then((user) => {
                const newAccountProperties = {
                  userId: user.userId,
                  password: encoded,
                };

                accountModel
                  .create(newAccountProperties, { transaction })
                  .then((account) => {
                    const message = {
                      from: 'timbredeveloper@gmail.com',
                      to: req.body.mail,
                      subject: 'Authentication email',
                      html: `<h2>다음 링크로 들어가 이메일 인증을 완료하세요!</h2> <a href="http://${host}/auth_email?token=${token}">이메일 인증하기</a>`,
                    };

                    transaction.commit();

                    // 메일 비동기 전송
                    smtp.sendMail(message, (err) => {
                      if (err) {
                        // TODO : 로깅 필요
                      }
                    });

                    res.status(201).json({ message: '회원가입에 성공했습니다!', user, account });
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
          })
          .catch(() => {
            res.status(400).json({ message: '알 수 없는 예외가 발생했습니다.' });
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
        attributes: ['userId', 'password'],
      }],
    })
    .then((user) => {
      if (user === null) {
        res.status(412).json({
          message: '로그인 정보가 올바르지 않습니다',
        });
      } else {
        const account = user.associations('accounts');

        // 암호화 된 해시값 비교
        if (bcrypt.compareSync(req.body.password, account.password)) {
          req.session.user = user;
          res.status(200).json({
            message: '로그인에 성공했습니다',
            user,
          });
        } else {
          res.status(401).json({
            message: '로그인에 실패했습니다',
          });
        }
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
    res.status(400).json({
      message: '로그아웃에 실패했습니다',
    });
  } else {
    req.session.user = undefined;
    res.status(204).json({
      message: '로그아웃에 성공했습니다',
    });
  }
};

exports.changePassword = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인이 필요합니다.',
    });
  } else {
    try {
      validatePassword(req.body.password);
    } catch (error) {
      res.status(400).json({ message: '비밀번호 변경에 실패했습니다.', detail: error.message });
      return;
    }

    // Bcrypt를 사용한 암호화
    const salt = bcrypt.genSaltSync();
    const encoded = bcrypt.hashSync(req.body.password, salt);

    accountModel
      .findOne({
        where: {
          userId: req.session.user.userId,
        },
      })
      .then((account) => {
        account.update({
          password: encoded,
        })
          .then((result) => {
            res.status(204).json({
              message: '비밀번호 변경에 성공했습니다',
              user: result,
            });
          });
      })
      .catch((err) => {
        res.status(400).json({
          message: '비밀번호 변경에 실패했습니다',
          detail: err,
        });
      });
  }
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

