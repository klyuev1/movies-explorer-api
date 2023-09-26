const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const { updateUser, getUserMe } = require('../controllers/users');

// GET -- получить пользователей
router.get('/users/me', getUserMe);

// PATCH -- обновить данные о себе
router.patch('/users/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    email: Joi.string().required().email(),
  }),
}), updateUser);

module.exports = router;
