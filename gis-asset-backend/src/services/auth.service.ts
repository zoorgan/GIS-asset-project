import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRepository, userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload, PublicUser, User } from '../models/user.model';

export interface AuthResult {
  token: string;
  expiresIn: string;
  user: PublicUser;
}

const BCRYPT_SALT_ROUNDS = 10;


const PG_UNIQUE_VIOLATION = '23505';


export class AuthService {
  constructor(private readonly repository: UserRepository = userRepository) {}

  async login(username: string, password: string): Promise<AuthResult> {
    const user = await this.repository.findByUsername(username);

  
    if (!user) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    return this.issueTokenFor(user);
  }

  
  async register(username: string, password: string): Promise<AuthResult> {
    const existing = await this.repository.findByUsername(username);
    if (existing) {
      throw ApiError.conflict('That username is already taken');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    let user: User;
    try {
      user = await this.repository.create(username, passwordHash, 'VIEWER');
    } catch (error) {
  
      if (isUniqueViolation(error)) {
        throw ApiError.conflict('That username is already taken');
      }
      throw error;
    }

    return this.issueTokenFor(user);
  }

  private issueTokenFor(user: User): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const signOptions: SignOptions = {
      expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign(payload, env.jwt.secret, signOptions);

    return {
      token,
      expiresIn: env.jwt.expiresIn,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === PG_UNIQUE_VIOLATION;
}

export const authService = new AuthService();
