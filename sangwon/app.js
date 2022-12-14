require("dotenv").config();

const http = require("http");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { DataSource } = require("typeorm");

const mysqlDataSource = new DataSource({
  type: process.env.TYPEORM_CONNECTION,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
});

mysqlDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.log("Error during Data Source initialization", err);
  });

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/ping", (req, res) => {
  return res.status(200).json({ message: "pong" });
});

app.post("/users/signup", async (req, res) => {
  const { name, email, password, profile_image } = req.body;

  await mysqlDataSource.query(
    `INSERT INTO users(
      name,
      email,
      password,
      profile_image
		) VALUES (?, ?, ?, ?);
		`,
    [name, email, password, profile_image]
  );
  return res.status(201).json({ message: "successfully created" });
});

app.post("/posts", async (req, res) => {
  const { title, content, content_image, user_id } = req.body;

  await mysqlDataSource.query(
    `INSERT INTO posts(
      title,
      content,
      content_image,
      user_id
    ) VALUES (?, ?, ?, ?);
    `,
    [title, content, content_image, user_id]
  );
  return res.status(201).json({ message: "successfully created" });
});

app.post("/likes", async (req, res) => {
  const { userId, postId } = req.body;

  try {
    await mysqlDataSource.query(
      `INSERT INTO likes(
    user_id,
    post_id
) VALUES(?,?)
`,
      [userId, postId]
    );
    return res.status(201).json({ message: "successfully liked" });
  } catch (err) {
    return res.status(409).json({ error: "already liked" });
  }
});

app.get("/posts/:userId/posts", async (req, res) => {
  const { userId } = req.params;

  const postingThings = await mysqlDataSource.query(
    `
    SELECT
      posts.id AS postingId,
      posts.content_image AS postingImageUrl,
      posts.content AS postingContent
    FROM posts
    INNER JOIN users ON users.id = posts.user_id
    WHERE users.id = ?
    `,
    [userId]
  );
  const [result] = await mysqlDataSource.query(
    `
    SELECT
      users.id AS userId,
      users.profile_image AS userProfileImage
    FROM users
    WHERE users.id = ?
    `,
    [userId]
  );

  result["postings"] = postingThings;
  return res.status(200).json({ data: result });
});

app.patch("/posts/:postId", async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;

  await mysqlDataSource.query(
    `UPDATE posts
     SET posts.content =?
     WHERE posts.id = ?
    `,
    [content, postId]
  );
  const result = await mysqlDataSource.query(
    `
    SELECT
      users.id AS userId,
      users.name AS userName,
      posts.id AS postingName,
      posts.title AS postingTitle,
      posts.content AS postingContent
    FROM posts
    INNER JOIN users ON users.id = posts.user_id
    WHERE posts.id = ${postId}
    `
  );
  return res.status(201).json({ data: result });
});

app.delete("/posts/:postId", async (req, res) => {
  const { postId } = req.params;

  await mysqlDataSource.query(
    `DELETE FROM posts
      WHERE posts.id = ${postId}
      `
  );
  return res.status(200).json({ message: "postingDeleted" });
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
  server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
