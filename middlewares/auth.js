const jwt = require('jsonwebtoken');
const AuthorizationError = require('../errors/AuthorizationError');

const { JWT_SECRET = 'secret-word' } = process.env;

// eslint-disable-next-line consistent-return
module.exports = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return next(new AuthorizationError('Необходима авторизация'));
  }

  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return next(new AuthorizationError('Необходима авторизация'));
  }

  req.user = payload;

  next();
};
