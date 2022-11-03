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
        await database.query(`ALTER TABLE users AUTO_INCREMENT=1;`);
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
        console.log(err.sqlMessage);
        if (err.errno === 1048) {
            return res.status(409).json({ error: 'invalid input' });
        } else if (err.sqlMessage.includes('Duplicate entry')) {
            return res
                .status(409)
                .json({ error: 'user email is already taken' });
        } else {
            return res.status(520).json({ error: err.sqlMessage });
        }
    }
});

app.post('/posts', async (req, res) => {
    const { title, content, contentImage, userId } = req.body;

    try {
        await database.query(`ALTER TABLE users AUTO_INCREMENT=1;`);
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
        console.log(err.sqlMessage);
        if (err.sqlMessage.includes('foreign key constraint fails')) {
            return res.status(409).json({ error: 'no such user' });
        }
        return res.status(520).json({ error: err.sqlMessage });
    }
});

const server = http.createServer(app);
const PORT = process.env.PORT;

const start = async () => {
    server.listen(PORT, () => console.log(`server is listening on ${PORT}`));
};

start();
