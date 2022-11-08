require('dotenv').config();

const http = require('http');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { DataSource } = require('typeorm');

const api = require('./../api');
const appDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
});

appDataSource
  .initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

app.get('/ping', (req, res) => {
  return res.status(200).json({ message: 'pong' });
});
app.post('/users', async (req, res) => {
  const { name, email, profile_image, password } = req.body;
  await myDataSource.query(
    `INSERT INTO users(
      name,
      email,
      profile_image,
      password
    ) VALUES (?, ?, ?, ?);
    `,
    [name, email, profile_image, password]
  );
  return res.status(201).json({ message: 'userCreated' });
});

app.post('/posts', async (req, res) => {
  const { title, content, user_id } = req.body;
  await myDataSource.query(
    `INSERT INTO posts(
      title,
      content,
      user_id
    ) VALUES (?, ?, ?);
    `,
    [title, content, user_id]
  );
  return res.status(201).json({ message: 'postCreated' });
});

app.get('/posts', async (req, res) => {
  const usersPost = await myDataSource.query(
    `SELECT(
    users.id AS userId,
    users.profile_image AS userProfileImage,
    posts.id AS postingId,
    posts.content_image AS postingImageUrl,
    posts.content AS postingContent
    FROM users, posts
    INNER JOIN posts ON users.id = posts.user_id
  )`
  );
  return res.status(200).json({ data: usersPost });
});

app.post('/likes', async (req, res) => {
  const { user_id, post_id } = req.body;
  await myDataSource.query(
    `INSERT INTO likes(
      user_id
      post_id
    ) VALUES (?, ?);
    `,
    [user_id, post_id]
  );
  return res.status(201).json({ message: 'likeCreated' });
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
  server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
