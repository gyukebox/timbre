const nodemailer = require('nodemailer');

exports.smtp = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'timbredeveloper@gmail.com',
    pass: 'AWEs0m2Developer@',
  },
});