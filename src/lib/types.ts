// Types centralisés pour l'application

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  email_verified: boolean;
  email_verification_token?: string;
  provider?: string;
  provider_id?: string;
  created_at: Date;
  updated_at: Date;
  reset_token?: string;
  reset_token_expiry?: Date;
  is_admin: boolean;
  is_banned: boolean;
  terms_accepted_at?: Date;
  profile_image?: string;
  banner_image?: string;
}

export interface Document {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
}

// Types pour les réponses d'actions
export interface ActionResult {
  success?: boolean;
  message?: string;
  documentId?: number;
  error?: string;
  documents?: Document[];
  document?: Document;
  user?: User;
  userId?: string;
  ok?: boolean;
  id?: number;
  dbResult?: { success: boolean; error?: string; document?: Document };
}

// Types pour les services
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  verificationToken: string;
}

export interface UpdateUserProfileData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  bannerImage?: string;
}

export interface CreateDocumentData {
  userId: number;
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateDocumentData {
  documentId: number;
  userId: number;
  title: string;
  content: string;
  tags: string[];
}

// Types pour la validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Types pour les emails
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Types pour les réponses de base de données
export interface DatabaseResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface UserRepositoryResult<T = unknown> extends DatabaseResult<T> {
  user?: User;
  users?: User[];
}

export interface DocumentRepositoryResult<T = unknown> extends DatabaseResult<T> {
  document?: Document;
  documents?: Document[];
}
