const sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const uuid = require('uuid/v4');
const userModel = require('../models/user/user');
const accountModel = require('../models/user/account');

exports.join = (req, res) => {
  if (req.session.auth_token === undefined || req.body.token !== req.session.auth_token) {
    res.status(412).send('회원가입 조건을 만족하지 않습니다');
    return;
  }

  req.session.auth_token = undefined;

  userModel
    .findOrCreate({
      where: {
        [sequelize.Op.or]: {
          mail: req.body.mail,
          name: req.body.username,
        },
      },
      defaults: {
        mail: req.body.mail,
        name: req.body.username,
        type: req.body.type,
        token: req.body.token,
        profile: req.file === undefined ? null : req.file.path,
      },
    })
    .spread((user, created) => {
      if (created) {
        accountModel.create({
          userId: user.dataValues.userId,
          password: req.body.password,
        });
        res.status(201).json({
          message: '회원가입에 성공했습니다!',
          detail: user,
        });
      } else {
        res.status(409).json({
          message: '해당 이메일이나 닉네임으로 이미 가입된 정보가 있습니다.',
          detail: user,
        });
      }
    })
    .catch(sequelize.ValidationError, (err) => {
      res.status(412).json({
        message: '회원가입 조건을 만족하지 않습니다.',
        detail: err,
      });
    })
    .catch((err) => {
      res.status(400).json({
        message: '알 수 없는 예외가 발생했습니다.',
        detail: err,
      });
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
  if (req.session.user === null || req.session.user === undefined) {
    res.status(400).send('로그아웃에 실패했습니다');
  } else {
    req.session.user = undefined;
    res.status(204).send('로그아웃에 성공했습니다');
  }
};

exports.changePassword = (req, res) => {
  if (req.session.user === null || req.session.user === undefined) {
    res.status(401).send('로그인이 필요합니다.');
  } else {
    accountModel
      .findOne({
        where: {
          userId: req.session.user.userId,
        },
      })
      .then((account) => {
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

exports.validateEmail = (req, res) => {
  const token = uuid();
  const message = {
    from: 'timbredeveloper@gmail.com',
    to: req.body.mail,
    subject: 'Authentication email',
    html: `<h2>아래 코드가 이메일 인증 코드입니다. 회원가입 시 명시하세요.</h2> <p>${token}</p>`,
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
      req.session.auth_token = token;
      res.json({
        message: '인증 메일을 성공적으로 보냈습니다.',
        detail: info.envelope,
      });
    }
  });
};

