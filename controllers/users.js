const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictingRequestError = require('../errors/ConflictingRequestError');

const CREATED = 201;

const { JWT_SECRET = 'secret-word' } = process.env;

module.exports.getUserMe = (req, res, next) => {
  const userId = req.user._id;
  User.findById(userId)
    .orFail(new NotFoundError('Пользоваетеля с таким id нет'))
    .then(({ name, email }) => res.status(200).send({ name, email }))
    .catch(next);
};

module.exports.updateUser = (req, res, next) => {
  const { email, name } = req.body;
  const opts = { runValidators: true, new: true };

  User.findByIdAndUpdate(req.user._id, { email, name }, opts)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь с таким ID не найден');
      }
      return res.send({ user });
    })
    .catch((err) => {
      if (err.code === 11000) {
        return next(new ConflictingRequestError('Пользователь с таким адресом электронной почты уже зарегистрирован'));
      }
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные'));
      }
      return next(err);
    });
};

module.exports.signUp = (req, res, next) => {
  const { email, password, name } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      email, password: hash, name,
    }))
    .then((user) => {
      res.status(CREATED).send({
        _id: user._id,
        email: user.email,
        name: user.name,
      });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError(`${Object.values(err.errors).map((error) => error.message).join(', ')}`));
      }
      if (err.code === 11000) {
        return next(new ConflictingRequestError('Пользователь с текущим email уже занят'));
      }
      return next(err);
    });
};

module.exports.signIn = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const payload = { _id: user._id };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('jwt', token, {
        httpOnly: true,
        sameSite: 'None',
        // secure: true
      });
      return res.send({ user: payload });
    })
    .catch(next);
};

module.exports.signOut = (req, res) => res.clearCookie('jwt').send({ message: 'See you soon' });
