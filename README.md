# 🚨CODE: RED🚨
  <img src="https://github.com/startcoriny/CODE-RED/assets/127919222/18bc54c9-8f35-4c76-90d9-935659c87542" alt="이미지 설명" width="500">                             


## 📌 프로젝트 개요
<b>여러 재난 상황이나 평소 위험한 상황에 대해서도 대처가 가능한 솔루션을 제공하기 위한 서비스
<br>

👉🏼 [ Entity Relationship Diagram ](https://drawsql.app/teams/me-662/diagrams/code-red)
<br>

👉🏼 [ 팀 Notion ](https://teamsparta.notion.site/CODE-RED-ad2da40664474ad988c4365951915031)
<br>

👉🏼 [ API 명세서 ]()

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

## 팀원

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

### 📁 Directory Structure: 폴더 구조

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

<br><br>
