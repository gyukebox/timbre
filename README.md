# Timbre

## 로컬 다운로드

```
$ git clone https://gyukebox@bitbucket.org/02soft/timbre.git
```

## 설정

Node.js 와 npm 이 설치되어있다고 가정합니다.

### 패키지 설정

```
$ npm install -g npm
$ npm install
```

### Elastic Beanstalk 설정

파이썬 dependency 가 있습니다.  
파이썬 2.7 이나 파이썬 3.4+ 를 먼저 설치해주세요

```
$ pip install --upgrade pip
$ pip install awsebcli --update --user
```

설치 완료후

```
$ eb use timbre-api-env
```