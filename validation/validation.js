const { statusGroups } = require('../enum/enum');

class ValidationError {
  constructor(message) {
    this.name = 'ValidationError';
    this.message = message;
  }
}

const keys = Object.keys(statusGroups);
let actorScriptsReadableStatus = [];
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  if (key !== 'wait') {
    actorScriptsReadableStatus = actorScriptsReadableStatus.concat(statusGroups[key]);
  }
}

exports.validateUsername = (username) => {
  const validPattern = /^[\w\d_]{10,100}$/;
  if (!validPattern.test(username)) {
    throw new ValidationError('올바른 닉네임 패턴이 아닙니다.');
  }
};

exports.validatePassword = (password) => {
  const validPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z_\-\d!@#$%^&*()]{10,100}$/;
  if (!validPattern.test(password)) {
    throw new ValidationError('올바른 패스워드 패턴이 아닙니다.');
  }
};

exports.validateEmail = (email) => {
  const validPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!validPattern.test(email)) {
    throw new ValidationError('올바른 이메일 패턴이 아닙니다.');
  }
};

exports.validateUserType = (type) => {
  if (type !== 'ACTOR' && type !== 'CLIENT') {
    throw new ValidationError('올바른 사용자 타입이 아닙니다.');
  }
};

exports.isBlank = value => value === undefined || value === null || String(value) <= 0;

exports.isValidStatus = status => Object.prototype.hasOwnProperty.call(statusGroups, status);

exports.isValidPageParameters = (from, size) => size === undefined || Number.isInteger(size) === false || Number(size) > 0 ||
    from === undefined || Number.isInteger(from) === false || Number(from) >= Number(size);

exports.isBiddingAcceptableState = state => state === 'ON_BIDDINGS';

exports.isScriptsReadableForActor = state => actorScriptsReadableStatus.indexOf(state) > -1;
