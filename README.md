# 🚨CODE: RED🚨
  <img src="https://github.com/startcoriny/CODE-RED/assets/127919222/18bc54c9-8f35-4c76-90d9-935659c87542" alt="이미지 설명" width="500">                             

<br>

## 📌 프로젝트 개요
<br>

👉🏼 [ Entity Relationship Diagram ](https://drawsql.app/teams/me-662/diagrams/code-red)
<br>

👉🏼 [ 팀 Notion ](https://teamsparta.notion.site/CODE-RED-ad2da40664474ad988c4365951915031)
<br>

👉🏼 [ 배포 URL ](https://coderedbox.com/)

<br>

## 📌 프로젝트 설명

**여러 재난 상황이나 평소 위험한 상황에 대해서도 대처가 가능한 솔루션을 제공하기 위한 서비스**

재난 문자알림을 켜놓으면
실종신고 같은 재난, 사건사고와는 거리가 먼 알림들이 오게 됩니다.<br />
내주위 사건사고, 내주위의 재난등을 알고싶은건데? 이러한 정보만 줄 수 있는 곳은 없을까?
라는 고민에서 시작하여<br />
시위를 자주하는 광화문을 가야하는데 여기는 안전한가?<br />
나는 방독마스크가 있는데 통조림 많이 가지고 있는 사람이랑 교환할수는 없나?<br />
실제 필요한 내용인 내주변 대피소는 어디있는지
119신고까지는 아니어도, 나를 도와줄 사람이 필요했으면 좋겠다 라는 상황을 가정하고 <br />
기획을 하게 되었습니다.

**<주요 기능>**
- **현 위치 및 목적지 위험도 조회**
  - **위험도 판단 기준** <br>
    <img src="https://github.com/startcoriny/CODE-RED/assets/127919222/7b79fef7-aeb3-49c8-83b0-65cfcf756b59" alt="이미지 설명" width="500">
  - ‘매우 위험’의 위험도를 표기하여 사용자로 하여금 혼란을 방지하고 정확한 상황을 인지할 수 있도록 구현
  - 예외처리
    - 서울 이외의 지역의 현위치가 측정될 경우,<br> 지원하지 않는 지역임을 사용자에게 알려주지만 재난 상황에 대한 정보와 알림을 받을 수 있도록 구현 <br> 
      
- **크롤링을 이용한 사건/사고 뉴스 수집(Python)** - <a href='https://github.com/startcoriny/CODE-RED_Crawling'>CODE-RED_Crawling</a>
    - Selenium과 BeautifulSoup을 사용하여 뉴스 정보 크롤링(당일 날짜 기준, 사건사고 내용에 대한 뉴스)
    - 필터링(사건/사고에 해당하는 키워드, 문자열 유사도 알고리즘(Jaro-Winkler similarity)을 활용한 중복 제거)
    - 나이브 베이즈 분류 모델을 활용한 사건/사고 구분
   <br>

- **주변 대피소 검색**
  - 카카오 지도 api와 서울시 지진 대피소 open api를 활용
  - 키워드 검색시 해당 키워드를 상세주소와 장소명 중 하나라도 포함되어있는 데이터들을 마커를 통해 시각화
  - 마커 클릭시 면적을 포함한 상세 정보출력
  <br>
  
- **내 위치 기반 지역별 실시간 채팅(서울특별시의 구들로 한정)**
  - 사용자의 위치 정보를 받아와 해당 위치에 가장 가까운 구로 배치
  - 비회원일 경우에도 임의의 아이디를 부여 하여 채팅 가능
  - 욕성 데이터를 사용하여 욕설 필터링
  - 휘발성이기 때문에 DB사용 x
  <br>
  
- **구호 물품 교환 및 1:1 채팅**
    - 재난 상황에서, 유저가 우리 서비스에 더 오래 머무르게 할 수 없을까? 라는 고민에서 비롯된 구호 물품 교환 서비스
    - 교환 과정에서 전화번호나 현재 장소 등 민감한 정보도 공유해야 하는 점을 고려하여 일대일로 대화할 수 있는 DM(Direct Message) 기능 도입
    - 일회성의 대화가 아닌 점을 감안하여 대화 내역을 DB에 저장
    - 채팅은 I/O가 매우 잦기 때문에 중간 단계의 저장소로 레디스를 고려하여 List 자료구조로 채팅을 저장, 서빙
    - 유저 입장에서 오래된 기록들은 볼 일이 드물다고 생각되어 매일 새벽 4시에 오래된 채팅 기록들은 메인DB에 이전하도록 스케쥴러 설정
  <br>
  
- **구조 요청 서비스**
    - postgis를 사용하여 내 위치를 저장
    - 저장된 내 위치를 기준으로 주변 유저들 탐색
    - fcm을 통한 구조 요청 보내기
    - 수락한 유저와의 최단 거리 계산
  <br>
  
- **재난 상황 실시간 알림**
    - axios, 역지오코딩을 활용한 실시간 재난 문자 현황 데이터 수집 및 가공
    - 주기적으로 재난 문자 발송 현황 데이터를 조회 → 파싱 → 정보 추출 → 지역별 재난 문자 발송 현황을 스트림으로 관리
    - 사용자의 위도/경도를 역지오코딩을 통해 ‘지역명’을 추출하여 지역별 스트림을 생성 → 컨슈머 그룹에 사용자 정보를 할당 → 재난 상황 관련 알림을 수신할 지역별 사용자 그룹을 스트림으로 관리
    - 서버는 지역별로 새로운 재난 문자가 수신되는지를 모니터링
    - 새로운 재난 문자 메세지가 추가됐다면, 해당 지역명과 일치하는 컨슈머 그룹(사용자 그룹)을 조회하여 FCM을 통해 웹 푸시 알림을 전송
  <br>
  

  
<br>

### 💻 기술 스택

|    Tech     |        Stack                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :---------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|     FE      |                                                <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=HTML5&logoColor=white" /> <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=CSS3&logoColor=white" /> <img src="https://img.shields.io/badge/Javascript-F7DF1E?style=for-the-badge&logo=Javascript&logoColor=white" />  <img src="https://img.shields.io/badge/handlebars-E05735?style=for-the-badge&logo=handlebarsdotjs&logoColor=white">                                               |
| **BE CORE** |                                         <img src="https://img.shields.io/badge/Typescript-3178C6?style=for-the-badge&logo=Typescript&logoColor=white" /> <img src="https://img.shields.io/badge/nestjs-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" /> <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />                                          |
|     BE      |                                                                                                         <img src="https://img.shields.io/badge/jest-C21325?style=for-the-badge&logo=jest&logoColor=white" /> <img src="https://img.shields.io/badge/redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens"> <img src="https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white">  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" /> <img src="https://img.shields.io/badge/axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />                                                                                                  |
| Environment |                                                                                                   <img src="https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/yaml-%23ffffff.svg?style=for-the-badge&logo=yaml&logoColor=151515" /> <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" />                                                                                                   |
|   Co-work   | <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white" /> <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=GitHub&logoColor=white" /> <img src="https://img.shields.io/badge/slack-4A154B?style=for-the-badge&logo=slack&logoColor=white" /> <img src="https://img.shields.io/badge/notion-000000?style=for-the-badge&logo=notion&logoColor=white" /> |


<br>

### 🔧 개발 기간

**2024.03.25 ~ in progress**

- 2024.04.16 중간 발표
- 2024.05.02 최종 발표

<br>

## 🐥팀원

|                  <img src="https://avatars.githubusercontent.com/u/127919222?v=4" width="150px">                  |                   <img src="https://avatars.githubusercontent.com/u/86586908?v=4" width="150px">                    |               <img src="https://avatars.githubusercontent.com/u/154207883?v=4" width="150px">                |
| :---------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------: |
|                                                      곽지민                                                       |                                                       이경복                                                        |                                                    강영우                                                    |
|                                                       팀장                                                        |                                                       부팀장                                                        |                                                     팀원                                                     |
| <a href="https://github.com/startcoriny">github</a> <br> <a href="https://startcoriny.tistory.com/">tech blog</a> | <a href="https://github.com/boogie-bogie">github</a> <br> <a href="https://velog.io/@boogiegie/posts">tech blog</a> | <a href="https://github.com/young970319">github</a> <br> <a href="https://devkyw.tistory.com/">tech blog</a> |
|                  <img src="https://avatars.githubusercontent.com/u/154427758?v=4" width="150px">                  |                   <img src="https://avatars.githubusercontent.com/u/146878715?v=4" width="150px">                   |                                                                                                              |
|                                                      조민근                                                       |                                                       오다은                                                        |                                                                                                              |
|                                                       팀원                                                        |                                                        팀원                                                         |                                                                                                              |
|    <a href="https://github.com/alsgeun">github</a> <br> <a href="https://blog.naver.com/mgeun97">tech blog</a>    |      <a href="https://github.com/ooheunda">github</a> <br> <a href="https://ooheunda.github.io/">tech blog</a>      |                                                                                                              |


<br>

### 📁 폴더 구조 및 환경 변수

<details>
  <summary><b>Directory Structure</b></summary>

```bash
.
├─public
│      helperLocation.js
│      location.js
│
├─redis
├─src
│  │  app.module.ts
│  │  main.ts
│  │
│  ├─auth
│  │  │  auth.controller.spec.ts
│  │  │  auth.module.ts
│  │  │  auth.service.spec.ts
│  │  │  auth.service.ts
│  │  │
│  │  └─guard
│  │          jwt-auth.guard.ts
│  │          jwt.guard.ts
│  │          jwt.strategy.ts
│  │
│  ├─aws
│  │      aws.module.ts
│  │      aws.service.spec.ts
│  │      aws.service.ts
│  │
│  ├─common
│  │  │  common.module.ts
│  │  │
│  │  ├─config
│  │  │      env.config.ts
│  │  │
│  │  ├─decorator
│  │  │      user.decorator.ts
│  │  │
│  │  ├─entities
│  │  │      base-model.entity.ts
│  │  │      disaster-data.entity.ts
│  │  │      emergency-data.entity.ts
│  │  │      follows.entity.ts
│  │  │      notification-messages.entity.ts
│  │  │      posts.entity.ts
│  │  │      scores.entity.ts
│  │  │      shelters.entity.ts
│  │  │      users.entity.ts
│  │  │
│  │  └─types
│  │          disaster-alert-level.type.ts
│  │          disaster-large-category.type.ts
│  │          disaster-small-category.type.ts
│  │          emergency-alert-level.type.ts
│  │          emergency-large-category.type.ts
│  │          emergency-small-category.type.ts
│  │          notification-messages-category.type.ts
│  │          post-status.type.ts
│  │          user-role.type.ts
│  │
│  ├─crawling
│  │      crawling.module.ts
│  │      news-crawling.service.ts
│  │
│  ├─main
│  ├─mayday
│  │  │  mayday.controller.spec.ts
│  │  │  mayday.controller.ts
│  │  │  mayday.module.ts
│  │  │  mayday.service.spec.ts
│  │  │  mayday.service.ts
│  │  │
│  │  ├─dto
│  │  │      create-mayday.dto.ts
│  │  │      location.dto.ts
│  │  │      update-mayday.dto.ts
│  │  │
│  │  └─entities
│  │          location.entity.ts
│  │          mayday-records.entity.ts
│  │
│  ├─news
│  │  │  news.controller.spec.ts
│  │  │  news.controller.ts
│  │  │  news.module.ts
│  │  │  news.service.spec.ts
│  │  │  news.service.ts
│  │  │
│  │  └─entities
│  │          news.entity.ts
│  │
│  ├─posts
│  │  │  posts.controller.spec.ts
│  │  │  posts.controller.ts
│  │  │  posts.module.ts
│  │  │  posts.service.spec.ts
│  │  │  posts.service.ts
│  │  │
│  │  └─dto
│  │          create-post.dto.ts
│  │          find-post-query.dto.ts
│  │
│  ├─shelters
│  │  │  shelters.controller.spec.ts
│  │  │  shelters.controller.ts
│  │  │  shelters.module.ts
│  │  │  shelters.service.spec.ts
│  │  │  shelters.service.ts
│  │  │
│  │  └─shelters-map
│  │          shelters-map-style.css
│  │          shelters-map.html
│  │
│  ├─users
│  │  │  users.controller.spec.ts
│  │  │  users.controller.ts
│  │  │  users.module.ts
│  │  │  users.service.spec.ts
│  │  │  users.service.ts
│  │  │
│  │  └─dto
│  │          create-user.dto.ts
│  │          login.dto.ts
│  │          update-user.dto.ts
│  │
│  └─utils
│          utils.module.ts
│          utils.service.spec.ts
│          utils.service.ts
│
├─test
│      app.e2e-spec.ts
│      jest-e2e.json
│
└─views
    │  discripthandlebars.txt
    │
    ├─layouts
    │      main.handlebars
    │
    ├─main
    │      index.handlebars
    │
    └─partials
            footer.handlebars
            header.handlebars

```
</details>
<details>
  <summary><b>Env example</b></summary>

```bash

#Redis
REDIS_HOST
REDIS_DM_HOST
REDIS_PORT
REDIS_DM_PORT
REDIS_PASSWORD

# JWT
JWT_SECRET_KEY

# bcrypt
PASSWORD_SALT_ROUNDS

# Database_postgreSQL
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_NAME
DB_SYNC


# AWS S3 
AWS_REGION
AWS_S3_ACCESS_KEY_ID
AWS_S3_SECRET_ACCESS_KEY
AWS_S3_BUCKET_NAME

# API KEY
SHELTER_API
REAL_TIME_DATA_API

# 역지오코딩 API KEY
KAKAO_MAP_REST_API_KEY
KAKAO_REST_API_KEY

# 공공데이터 재난문자 현황 API
DISASTER_API_KEY
API_ENDPOINT

# 카카오로그인
KAKAO_LOGIN_REST_API_KEY

# 알림 허용 권한 요청시 필요한 키
# 1. vapidKey
VAPID_PUBLIC_KEY

# 2. Firebase config
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGEBUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID

# Firebase config
FIREBASE_TYPE
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
FIREBASE_CLIENT_ID
FIREBASE_AUTH_URI
FIREBASE_TOKEN_URI
FIREBASE_AUTH_PROVIDER_X509_CERT_URL
FIREBASE_CLIENT_X509_CERT_URL
GCM_KEY
SUBJECT
VAPID_PRIVATE_KEY

# Notification push and click move url
BASIC_URL
HOST

```
</details>

<br><br>

## 🚀시작 가이드

### installation
```
$ git clone https://github.com/startcoriny/CODE-RED.git
$ cd CODE-RED
```

### BackEnd
```
$ npm ci
$ npm run start:dev
```
<br><br>
## 🖥️화면 구성
|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/806003a3-ee40-46a0-ace4-d191306547e5" width="300px"> |<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/d524d26a-e69e-4e6e-be4d-6eba1f7d76cf" width="300px">|
|:---:|:---:|
|메인페이지|목적지 위험도 조회|
|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/f839da93-e5ff-4faf-b419-15c59dd76663" width="300px" height="482.859px">|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/776a855e-f1dd-4c02-bd92-40fb185060b8" width="300px" height="482.859px">|
|크롤링을 이용한 사건/사고 뉴스 수집|주변 대피소 검색|
|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/acb28bb5-a960-402f-bd62-4c7550098bc2" width="450px"><br><img src="https://github.com/startcoriny/CODE-RED/assets/127919222/495284ce-d5b9-4ae3-a1f3-7419337e02c6" width="450px">|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/85eed748-5d76-4659-bad2-8071da11ee3d" width="450px" height="300px"><br><img src="https://github.com/startcoriny/CODE-RED/assets/127919222/be70022c-1ec7-47ab-8d7c-26afac481d7b" width="450px" height="300px">|
|내 위치 기반 지역별 실시간 채팅|구호 물품 교환 및 1:1 채팅|
|유저 도움요청<br><img src="https://github.com/startcoriny/CODE-RED/assets/127919222/03d04fed-2c0f-4ab2-9a42-2b72b578d947" width="225px"> 헬퍼 도움 수락<br><img src="https://github.com/startcoriny/CODE-RED/assets/127919222/e6e481cd-9464-47f3-b5a0-35732cde29c5" width="225px"><br> 유저 헬퍼 평가<br><img src="https://github.com/startcoriny/CODE-RED/assets/127919222/5aa6b813-c660-4c6a-8e78-6b82fdb34c52" width="300px">|<img src="https://github.com/startcoriny/CODE-RED/assets/127919222/1dccaa27-4809-4596-a061-566dd201b2b7" width="500px">|
|구조 요청 서비스|재난 상황 실시간 알림|
