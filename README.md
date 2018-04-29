# Timbre

## 로컬 다운로드

```
$ git clone https://github.com/gyukebox/timbre
```

## 설정

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

## 배포

AWS IAM user 의 access ID 와 secret key 를 각각 `AWS_ACEESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 라는 이름으로 저장.  
그 다음, 스크립트 실행. (실행권한이 없으면 `chmod 755` 수행)

```
$ chmod 755 setup-eb.sh
$ setup-eb.sh
```

완료 후, Elastic Beanstalk CLI 를 통하여 다음 명령어로 배포.

```
$ eb deploy
```

(`master` 브랜치 머지 시 자동배포 됩니다.)

## API Reference

Postman docs - available [here](https://documenter.getpostman.com/view/3135479/dpm-timbre/RW1bmeN2#2b52f61b-2917-97e2-53b4-90697f8b69cf)  
Postman collection - available [here](https://www.getpostman.com/collections/92aa173b799b02cbd385)