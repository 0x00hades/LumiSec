import { AppError } from '../utils/appError.js';

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(new AppError(err.message || 'Internal Error', err.statusCode || 500));
    });
  };
}

export { asyncHandler };


