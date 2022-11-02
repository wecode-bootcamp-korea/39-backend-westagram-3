// 사용하는 npm 패키지(모듈)들 : express, nodemon, cors, dotenv, morgan

const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan'); //morgan 모듈 추가하기
const dotenv = require('dotenv');

const { DataSource } = require('typeorm'); //DataSource 모듈을 불러오기 

dotenv.config(); //dotenv 사용
// ES 모듈에서 환경 변수 불러오기(import) 다시 공부하기.

const myDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE
}) //process객체 : node.js 기본 글로벌 객체로 별도의 require 호출 없이 모든 모듈에서 접근이 가능 (process의 정확한 기능은 무엇인지?)

myDataSource.initialize()
  .then(() => {
      console.log("Data Source has been initialized!")
  })

app.use(cors());
app.use(morgan('combined')); //morgan 사용하기 (combined, common, dev, short, tiny)

app.get('/ping', function (req, res, next){
  res.json({message:'pong'});
})
app.listen(3000, () => { console.log('server listening on port 3000')});


/*  (morgan)
로그 포맷 선택
1. combined (로그 내용)
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"

2. common
[:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]]

3. dev 
[:method :url :status :response-time ms - :res[content-length]]

4. short
[:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms]

5. tiny
[:method :url :status :res[content-length] - :response-time ms]
*/