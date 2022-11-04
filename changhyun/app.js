require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { DataSource } = require('typeorm');
const app = express();

const PORT = process.env.PORT

const appDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE
})

appDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!")
  })
  .catch((error) => {
    console.error(error);
  })

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get("/ping", function (req, res, next) {
  return res.status(200).json({ message : "pong" });
});

app.post('/create', async (req, res) => {
	const { name, email, profile_image, password } = req.body
	await appDataSource.query(
		`INSERT INTO users(
      name,
      email,
      profile_image,
      password
      ) VALUES (?, ?, ?, ?);
      `,
      [ name, email, profile_image, password ]
    ); 
    res.status(201).json({ message : "userCreated" });
	});

app.post('/post', async (req, res) => {
  const { title, content, image, user_id } = req.body
  await appDataSource.query(
    `INSERT INTO posts(
      title,
      content,
      image,
      user_id
      ) VALUES (?, ?, ?, ?);
      `,
      [ title, content, image, user_id ]
    ); 
    res.status(201).json({ message : "postCreated" });
  });

app.get('/posts/view', async (req, res) => {
  await appDataSource.query(
    `SELECT
      users.id as userID,
      users.profile_image as userProfileImage,
      posts.id as postingId,
      posts.image as postingImageUrl,
      posts.content as postingContent
      FROM users 
      INNER JOIN posts ON posts.user_id = users.id;
      `, (err, rows) => {
        res.status(200).json({data : rows});
    })
});

app.listen(PORT, () => { console.log(`server listening on port ${PORT}`)});