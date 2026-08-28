import { body } from 'express-validator';

export const loginValidator = [
  body('username')
    .isString().withMessage('username must be a string')
    .trim()
    .notEmpty().withMessage('username is required'),

  body('password')
    .isString().withMessage('password must be a string')
    .isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
];

export const registerValidator = [
  body('username')
    .isString().withMessage('username must be a string')
    .trim()
    .isLength({ min: 3, max: 64 }).withMessage('username must be between 3 and 64 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('username may only contain letters, numbers, underscores, dots, and hyphens'),

  body('password')
    .isString().withMessage('password must be a string')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters')
    .matches(/[a-zA-Z]/).withMessage('password must contain at least one letter')
    .matches(/[0-9]/).withMessage('password must contain at least one number'),


  body('confirmPassword')
    .custom((value: string, { req }) => value === req.body.password)
    .withMessage('confirmPassword must match password'),
];

