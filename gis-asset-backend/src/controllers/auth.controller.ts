import { Request, Response } from 'express';
import { AuthService, authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as { username: string; password: string };
    const result = await this.service.login(username, password);
    sendSuccess(res, result);
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as { username: string; password: string };
    const result = await this.service.register(username, password);
    sendSuccess(res, result, 201);
  };
}

export const authController = new AuthController();
