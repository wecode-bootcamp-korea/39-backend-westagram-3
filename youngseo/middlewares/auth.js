const validateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if ( !token ) {
            return res.status(400).json({ message: "KEY_ERROR"})
        }
        const decoded = jwt.verify(jwtToken, secretKey);
        next();
    } catch(err) {
        return res.status(400).json({ message: "Invalid Access Token"})
    }
};

module.exports = { validateToken };