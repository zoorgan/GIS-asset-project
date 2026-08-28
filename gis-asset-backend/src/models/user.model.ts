export type UserRole = 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}


export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string; 
  username: string;
  role: UserRole;
}
