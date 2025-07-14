import { User } from '@/types.ts';
declare class AuthService {
  private static instance;
  private currentUser;
  private constructor();
  static getInstance(): AuthService;
  login(email: string, password: string): Promise<User>;
  register(userData: { email: string; password: string; name: string }): Promise<User>;
  logout(): void;
  getCurrentUser(): User | null;
  isAuthenticated(): boolean;
  updateProfile(profileData: Partial<User>): Promise<User>;
}
export declare const authService: AuthService;
export default authService;
