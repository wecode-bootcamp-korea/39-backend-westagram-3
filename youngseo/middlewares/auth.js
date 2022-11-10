const loginRequired = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if ( !token ) {
            return res.status(400).json({ message: 'LOGIN_REQUIRED'})
        }

        const decoded = jwt.verify(jwtToken, secretKey);
        const userId = decoded.userId

        const [user] = await appDataSource.query(`
            SELECT 
                *
            FROM users
            WHERE users.id = ?
            `, [userId]
        );

        if (!user) {
            return res.status(400).json({ message: 'USER_DOES_NOT_EXIST'});
        }

        req.user = user;
        next();
    } catch(err) {
        return res.status(400).json({ message: "Invalid Access Token"})
    }
};

module.exports = { loginRequired };