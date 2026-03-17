import { User as FirebaseUser } from '@angular/fire/auth';

export interface User {
  id: string,
  displayName?: string,
  password: string,
  email: string,
  role: Role
}

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

// Type pour le User Firebase Auth enrichi avec le rôle
export interface AuthUserWithRole extends FirebaseUser {
  role: Role;
}
