import joi from 'joi';
import { AppError } from '../utils/appError.js';

const parseArray = (value, helper) => {
  try {
    const data = JSON.parse(value);
    const schema = joi.array().items(joi.string());
    const { error } = schema.validate(data);
    if (error) return helper(error.details);
    return true;
  } catch (e) {
    return helper('Invalid array JSON');
  }
};

const generalFields = {
  name: joi.string().min(2).max(200),
  description: joi.string().max(2000),
  objectId: joi.string().hex().length(24),
  email: joi.string().email(),
  password: joi.string(),
  cPassword: joi.any().valid(joi.ref('password')),
  colors: joi.custom(parseArray),
  sizes: joi.custom(parseArray),
};

function isValid(schema) {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    const { error } = schema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next();
  };
}

export { isValid, generalFields };


