require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { DataSource } = require("typeorm");
const app = express();

const PORT = process.env.PORT;

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
    console.log("Data Source has been initialized!");
  })
  .catch((error) => {
    console.error(error);
  });

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/ping", function (req, res, next) {
  return res.status(200).json({ message: "pong" });
});

app.post("/user/info", async (req, res, next) => {
  const { name, email, profileImage, password } = req.body;

  await appDataSource.query(
    `INSERT INTO users(
      name,
      email,
      profile_image,
      password
    ) VALUES (?, ?, ?, ?);
    `,
    [name, email, profileImage, password]
  );

  res.status(201).json({ message: "userCreated" });
});

app.post("/post", async (req, res, next) => {
  const { title, content, imageUrl, userId } = req.body;

  await appDataSource.query(
    `INSERT INTO posts(
      title,
      content,
      image_url,
      user_id
    ) VALUES (?, ?, ?, ?);
      `,
    [title, content, imageUrl, userId]
  );

  res.status(201).json({ message: "postCreated" });
});

app.get("/posts/view", async (req, res, next) => {
  await appDataSource.query(
    `SELECT
      users.id as userID,
      users.profile_image as userProfileImage,
      posts.id as postingId,
      posts.image_url as postingImageUrl,
      posts.content as postingContent
    FROM users 
    INNER JOIN posts
    ON posts.user_id = users.id;
    `,
    (err, rows) => {
      res.status(200).json({ data: rows });
    }
  );
});

app.get("/user/post/:id", async (req, res, next) => {
  const { id } = req.params;

  const userInfo = await appDataSource.query(
    `SELECT
      users.id as userID,
      users.profile_image as userProfileImage
      FROM users
      WHERE users.id = ${id};
    `
  );
  const userPost = await appDataSource.query(
    `SELECT
      posts.id as postingId,
      posts.image as postingImageUrl,
      posts.content as postingContent
      FROM posts
      WHERE posts.user_id = ${id};
    `
  );
  userInfo[0]["postings"] = userPost;
  res.status(200).json({ data: userInfo });
});

app.patch("/post/:userId/:postId", async (req, res, next) => {
  const { userId, postId } = req.params;
  const { content } = req.body;
  await appDataSource.query(
    `UPDATE 
        posts
      SET content = ?
      WHERE user_id = ${userId} and id=${postId};
    `,
    [content]
  );

  await appDataSource.query(
    `SELECT
      users.id as userId,
      users.name as userName,
      posts.id as postingId,
      posts.title as postingTitle,
      posts.content as postingContent
    FROM users
    INNER JOIN posts
    ON users.id = posts.user_id
    WHERE users.id = ${userId} and posts.id=${postId};
    `,
    (err, rows) => {
      res.status(200).json({ data: rows });
    }
  );
});

app.delete("/post/:id", async (req, res, next) => {
  const { id } = req.params;
  await appDataSource.query(
    `DELETE 
      FROM posts
      WHERE id = ${id};
    `
  );
  res.status(200).json({ message: "postingDeleted" });
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
