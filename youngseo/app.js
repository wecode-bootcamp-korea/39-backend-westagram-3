require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;

const { loginRequired } = require('./middlewares/auth.js')

const makeHash = async (password, saltRounds) => {
    return await bcrypt.hash(password, saltRounds);
}

const { DataSource } = require('typeorm');

const appDataSource = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
})

appDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    });
    

const app = express()

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));


app.get("/ping", (req,res) => {
    return res.status(200).json({ message : "pong"})
});

app.post("/users/signup", async (req, res) => {
    const { name, email, password, profile_image } = req.body 
    const hashedPassword = await makeHash(password, 12);

    await appDataSource.query(
        `INSERT INTO users(
            name,
            email,
            password,
            profile_image
        ) VALUES (?, ?, ?, ?);
        `,
        [ name, email, hashedPassword, profile_image]
    ); 

    return res.status(201).json({ message: "userCreated" });
});

app.post("/users/login", async (req, res) => {
    const { email, password } = req.body

    const [userInfo] = await appDataSource.query(
        `SELECT 
            *
        FROM users
        WHERE users.email = ?
        `, [email]
    );

    const match = await bcrypt.compare(password, userInfo.password)

    if (!match) {
        return res.status(409).json({ message : "Invalid User" });
    };

    const payLoad = { userId : userInfo.id };
    const jwtToken = jwt.sign(payLoad, secretKey);
    return res.status(200).json({ accessToken: jwtToken });
});


app.post("/posts", loginRequired, async (req, res) => {
    const { title, content, content_image} = req.body
    const { userId } = req.user.id

    await appDataSource.query(
        `INSERT INTO posts(
            title,
            content,
            content_image,
            userId
        ) VALUES (?, ?, ?, ?);
        `,
        [ title, content, content_image, userId ]
    ); 

    return res.status(201).json({ message: "postCreated" });
});


app.get("/posts", async(req, res) => {
    await appDataSource.query(
        `SELECT 
            users.id AS userId,
            users.profile_image AS userProfileImage,
            posts.id AS postingId,
            posts.content_image AS postigImageUrl,
            posts.content AS postingContent
        FROM users 
        INNER JOIN posts ON users.id = posts.user_id`
            ,(err, rows) => {
        return res.status(200).json({data:rows});
            });
});


app.get("/users/:userId/posts", async (req, res) => {
    const userId = req.params.userId

    const [user] = await appDataSource.query(
        `SELECT 
            users.id AS userId,
            users.profile_image AS userProfileImage
        FROM users
        WHERE users.id = ?
        `, [userId]
    );
    
    const posts = await appDataSource.query(
        `SELECT 
            posts.id AS postingId,
            posts.content_image AS postingImageUrl,
            posts.content AS postigContent
        FROM posts
        INNER JOIN users ON users.id = posts.user_id
        WHERE users.id = ?
        `, [userId]
     );

    user['postings'] = posts;

    return res.status(200).json({ data: user })
});


app.patch("/posts/:postId", async (req, res) => {
    const { title, content } = req.body
    const postId = req.params.postId

    await appDataSource.query(
        `UPDATE posts 
        SET 
            posts.title = ?, 
            posts.content = ?
        WHERE posts.id = ?
        `,
        [ title, content, postId ]
    ); 

    const [result] = await appDataSource.query(
        `SELECT 
            users.id AS userId,
            users.name AS userName,
            posts.id AS postingId,
            posts.title AS postingTitle,
            posts.content AS postingContent
        FROM users 
        INNER JOIN posts ON users.id = posts.user_id
        WHERE posts.id = ?
        `, [postId]
    );

    return res.status(200).json({data: result});
});


app.delete("/posts/:postId", async (req,res) => {
    const postId = req.params.postId

    await appDataSource.query(
        `DELETE FROM posts 
        WHERE posts.id = ?
        `, [postId]
    );

   return res.status(200).json({ message : "postingDeleted"});
});

app.post("/likes", async (req, res) => {
    const {user_id, post_id} = req.body

    try {
        await appDataSource.query(
        `INSERT INTO likes(
            user_id,
            post_id
        ) VALUES (?,?);
        `, [user_id, post_id]
    );
  return res.status(201).json({ message: "likeCreated" })
} catch (err) {
    return res.status(409).json({ error: "DoubleLiked" });
}
});

const server = http.createServer(app)
const PORT = process.env.PORT

const start = async () => {
    server.listen(PORT, ()=> console.log(`server is listening on ${PORT}`))
};

start();
