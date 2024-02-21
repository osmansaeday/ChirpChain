const jwt = require('jsonwebtoken');
// require('dotenv').config(); // Ensure environment variables are loaded (if not already loaded in your main file)

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add decoded token data to the request
    next(); // Move to the next middleware or route handler
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = auth;
