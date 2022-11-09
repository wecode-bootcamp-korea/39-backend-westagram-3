const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization; // (1)

    //. . . // (2)

    next(); // (3)
  } catch (err) {
    next(err);
  }
};
