const bcrypt = require('bcrypt');
const sequelize = require('sequelize');
const uuid = require('uuid/v4');
const database = require('../models/database');
const userModel = require('../models/user/user');
const accountModel = require('../models/user/account');
const { smtp } = require('../util/mailer');
const { host } = require('../resources/index');
const {
  validateUsername, validatePassword, validateEmail, validateUserType, isBlank,
} = require('../validation/validation');

exports.join = (req, res) => {
  const {
    username, password, mail, type,
  } = req.body;

  // 검증
  try {
    validateUsername(username);
    validatePassword(password);
    validateEmail(mail);
    validateUserType(type);
  } catch (error) {
    console.error(error);
    res.status(412).json({
      message: '회원가입 조건을 만족하지 않습니다.',
    });
    return;
  }

  userModel
    .findOne({
      where: {
        [sequelize.Op.or]: {
          mail,
          name: username,
        },
      },
    })
    .then((result) => {
      if (result !== null) {
        res.status(409).json({
          message: '해당 이메일이나 닉네임으로 이미 가입된 정보가 있습니다.',
        });
      } else {
        // 인증 정보 생성
        const token = uuid();
        const expiry = Date.now() + (1000 * 60 * 60);

        database
          .transaction()
          .then((transaction) => {
            const userProperties = {
              name: username,
              mail,
              type,
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
                  .then(() => {
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

                    res.status(201).json({
                      message: '회원가입에 성공했습니다.',
                    });
                  });
              })
              .catch(sequelize.ValidationError, (err) => {
                transaction.rollback();
                console.error(err);
                res.status(412).json({
                  message: '회원가입 조건을 만족하지 않습니다.',
                });
              })
              .catch(() => {
                transaction.rollback();
                res.status(400).json({
                  message: '알 수 없는 예외가 발생했습니다.',
                });
              });
          })
          .catch(() => {
            res.status(400).json({ message: '알 수 없는 예외가 발생했습니다.' });
          });
      }
    });
};

exports.login = (req, res) => {
  const { mail, password } = req.body;

  if (isBlank(password)) {
    res.status(412).json({
      message: '로그인 정보가 올바르지 않습니다.',
    });
    return;
  }

  userModel
    .findOne({
      where: {
        mail,
      },
      attributes: ['userId', 'name', 'mail', 'type'],
    })
    .then((user) => {
      if (user === null) {
        res.status(412).json({
          message: '로그인 정보가 올바르지 않습니다.',
        });
        return;
      }

      accountModel
        .findOne({
          where: {
            userId: user.userId,
          },
        })
        .then((account) => {
          // 암호화 된 해시값 비교
          if (bcrypt.compareSync(password, account.password)) {
            req.session.user = user;
            res.status(200).json({
              message: '로그인에 성공했습니다.',
              user,
            });
          } else {
            res.status(401).json({
              message: '로그인에 실패했습니다.',
            });
          }
        })
        .catch(() => {
          res.status(401).json({
            message: '로그인에 실패했습니다.',
          });
        });
    })
    .catch(() => {
      res.status(401).json({
        message: '로그인에 실패했습니다.',
      });
    });
};

exports.logout = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(400).json({
      message: '로그아웃에 실패했습니다.',
    });
  } else {
    req.session.user = undefined;
    res.status(204).json({
      message: '로그아웃에 성공했습니다.',
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
      res.status(400).json({
        message: '비밀번호 변경에 실패했습니다.',
      });
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
        account
          .update({
            password: encoded,
          })
          .then((result) => {
            res.status(204).json({
              message: '비밀번호 변경에 성공했습니다.',
              user: result,
            });
          })
          .catch(() => {
            res.status(400).json({
              message: '비밀번호 변경에 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '비밀번호 변경에 실패했습니다.',
        });
      });
  }
};

exports.verifyEmail = (req, res) => {
  userModel
    .findOne({
      attributes: ['userId', 'authorized', 'token', 'expiry'],
      where: { token: req.query.token },
    })
    .then((user) => {
      const now = new Date();
      if (user.expiry < now || user.authorized !== undefined || user.authorized !== null) {
        res.status(400).json({
          message: '인증에 실패하였습니다.',
        });
      } else {
        const attributes = { authenticated: now };
        const options = {
          where: {
            userId: user.userId,
          },
        };
        userModel
          .update(attributes, options)
          .then(() => {
            res.json({
              message: '인증에 성공하였습니다.',
            });
          })
          .catch(() => {
            res.status(400).json({
              message: '인증에 실패했습니다.',
            });
          });
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '인증에 실패했습니다.',
      });
    });
};

