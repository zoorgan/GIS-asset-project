import { QueryResultRow } from 'pg';
import { query } from '../config/database';
import { User, UserRole } from '../models/user.model';

interface UserRow extends QueryResultRow {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


export class UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const result = await query<UserRow>(
      `SELECT id, username, password_hash, role, created_at, updated_at
      FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await query<UserRow>(
      `SELECT id, username, password_hash, role, created_at, updated_at
      FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }


  async create(username: string, passwordHash: string, role: UserRole = 'VIEWER'): Promise<User> {
    const result = await query<UserRow>(
      `INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id, username, password_hash, role, created_at, updated_at`,
      [username, passwordHash, role]
    );
    return mapRow(result.rows[0]);
  }
}

export const userRepository = new UserRepository();
