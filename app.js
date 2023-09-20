// Подгружаем код
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookies = require('cookie-parser');
const cors = require('cors');
const { celebrate, Joi, errors } = require('celebrate');
const { signUp, signIn, signOut } = require('./controllers/users');
const auth = require('./middlewares/auth');
const NotFoundError = require('./errors/NotFoundError');
const InternalServerError = require('./errors/InternalServerError');
const { requestLogger, errorLogger } = require('./middlewares/logger');

// Создаем сервер, подключаемся к БД
const { PORT = 3001 } = process.env;

const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/moviesbd', {
  useNewUrlParser: true,
});

app.use(cors({ origin: ['http://localhost:3000', ''], credentials: true }));

// Создаем роуты
app.use(cookies());
app.use(express.json());

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.use(requestLogger);

app.use('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
    name: Joi.string().min(2).max(30),
  }),
}), signUp);
app.use('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
}), signIn);
app.use('/signout', signOut);

app.use(auth, require('./routes/users'));
app.use(auth, require('./routes/movies'));

app.use('*', auth, (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

app.use(errorLogger);
app.use(errors());
app.use(InternalServerError);
/* eslint-disable no-console */
app.listen(PORT, () => {
  console.log(`Server pushed on port ${PORT}`);
});

// создать доменные имена. Прописать их в корс
// Остановился на деплойе
