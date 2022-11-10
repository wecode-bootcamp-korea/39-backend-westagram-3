const jwt = require('jsonwebtoken');

const { DataSource } = require('typeorm');
const database = new DataSource({
    type: process.env.TYPEORM_CONNECTION,
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
});
database.initialize();

const loginRequired = async (req, res, next) => {
    const accessToken = req.headers.authorization;
    try {
        if (!accessToken) {
            const error = new Error('NEED_ACCESS_TOKEN');
            error.statusCode = 401;
            throw error;
        }

        const decoded = await jwt.verify(accessToken, process.env.JWT_SECRET);

        const user = await database.query(
            `
            SELECT 
                *
            FROM users
            WHERE users.id = ?
            `,
            [decoded.id]
        );

        if (!user) {
            const error = new Error('USER_DOES_NOT_EXIST');
            error.statusCode = 404;
            throw error;
        }

        req.user = user;
        next();
    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'unauthorized token' });
        }
        return res.status(err.statusCode).json({ message: err.message });
    }
};

module.exports = { loginRequired };
