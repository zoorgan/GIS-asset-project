import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';


export function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(
      ApiError.validation(
        'Validation failed',
        errors.array().map((e) => ({
          field: 'path' in e ? e.path : undefined,
          message: e.msg,
        }))
      )
    );
    return;
  }
  next();
}
