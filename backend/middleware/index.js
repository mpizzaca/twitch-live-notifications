const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "invalid token" });
  }

  try {
    // Verify the token - will throw error if invalid
    const token = jwt.verify(
      req.headers.authorization,
      process.env.JWT_PRIVATE_KEY
    );
    res.locals.token = token;
    next();
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
};

module.exports = { isAuthenticated };
