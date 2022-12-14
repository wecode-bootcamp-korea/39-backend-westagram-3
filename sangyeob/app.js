require('dotenv').config();

const http = require('http');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { DataSource } = require('typeorm');

const database = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
});

database.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
    })
    .catch((err) => {
        console.error('Error during Data Source initialization', err);
    });

app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.get('/ping', (req, res) => {
    return res.status(200).json({ message: 'pong' });
});

app.post('/users', async (req, res) => {
    const { name, email, password, profileImage } = req.body;

    try {
        await database.query(
            `INSERT INTO users(
                name,
                email,
                password,
                profile_image
            ) VALUES (?,?,?,?);
            `,
            [name, email, password, profileImage]
        );
        return res.status(201).json({ message: 'user successfully created' });
    } catch (err) {
        if (err.errno === 1048) {
            return res.status(409).json({ error: 'invalid input' });
        } else if (err.sqlMessage.includes('Duplicate entry')) {
            return res
                .status(409)
                .json({ error: 'user email is already taken' });
        } else {
            return res.status(520).json({ error: 'unknown error' });
        }
    }
});

app.post('/posts', async (req, res) => {
    const { title, content, contentImage, userId } = req.body;

    try {
        await database.query(
            `INSERT INTO posts(
                title,
                content,
                content_image,
                user_id
            ) VALUES (?,?,?,?);
            `,
            [title, content, contentImage, userId]
        );
        return res.status(201).json({ message: 'post successfully created' });
    } catch (err) {
        if (err.sqlMessage.includes('foreign key constraint fails')) {
            return res.status(409).json({ error: 'no such user' });
        } else {
            return res.status(520).json({ error: 'unknown error' });
        }
    }
});

app.get('/posts', async (req, res) => {
    await database.query(
        `SELECT
            users.id as userId,
            users.profile_image as userProfileImage,
            posts.id as postingId,
            posts.content_image as postingImageUrl,
            posts.content as postingContent
        FROM users
        INNER JOIN posts ON posts.user_id = users.id
        `,
        (err, posts) => {
            return res.status(200).json(posts);
        }
    );
});

app.get('/users/:userId/posts', async (req, res) => {
    const { userId } = req.params;

    try {
        const rows = await database.query(
            `SELECT
            users.id as userId,
            users.profile_image as userProfileImage,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    "postingId", posts.id,
                    "postingImageUrl", posts.content_image,
                    "postingContent", posts.content
                )
            ) as postings
            FROM
                posts
            JOIN users ON posts.user_id = users.id 
            WHERE user_id = ?
            GROUP BY posts.user_id;
            `,
            [userId]
        );

        return res.status(200).json({ data: rows });
    } catch (err) {
        return res.status(409).json({ error: 'invalid input' });
    }
});

app.put('/posts', async (req, res) => {
    const { postingId, postingTitle, postingContent, postingImage } = req.body;
    try {
        await database.query(
            `UPDATE posts
                SET
                    title = ?,
                    content = ?,
                    content_image = ?
                    WHERE id = ?;
            `,
            [postingTitle, postingContent, postingImage, postingId]
        );
        const rows = await database.query(
            `SELECT
                users.id as userId,
                users.name as userName,
                posts.id as postingId,
                posts.title as postingTitle,
                posts.content as postingContent
            FROM users
            INNER JOIN posts 
            WHERE posts.id = ? AND posts.user_id=users.id;
            `,
            [postingId]
        );

        return res.status(200).json({ data: rows });
    } catch (err) {
        return res.status(409).json({ error: 'invalid input' });
    }
});

app.delete('/posts/:postId', async (req, res) => {
    const { postId } = req.params;
    await database.query(
        `DELETE FROM likes
        WHERE post_id = ?
        `,
        [postId]
    );
    await database.query(
        `DELETE FROM posts
		WHERE id = ?
		`,
        [postId]
    );
    return res.status(200).json({ message: 'successfully deleted' });
});

app.post('/likes', async (req, res) => {
    const { userId, postId } = req.body;

    const rows = await database.query(
        `SELECT id,user_id,post_id
            FROM likes 
            WHERE user_id = ? AND post_id = ?;
        `,
        [userId, postId]
    );

    try {
        if (rows.length === 0) {
            await database.query(
                `INSERT INTO likes(
                    user_id,
                    post_id
                ) VALUES (?,?);
                `,
                [userId, postId]
            );
            return res.status(201).json({ message: 'like Created' });
        } else {
            throw 'already liked';
        }
    } catch (err) {
        if (err === 'already liked') {
            return res.status(409).json({ error: err });
        } else {
            return res.status(520).json({ error: 'Invalid input' });
        }
    }
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
    server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
