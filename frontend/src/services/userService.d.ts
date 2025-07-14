import { User, UserPreferences } from '@/types/api.js';
/**
 * UserService: Handles user profile, preferences, and entry retrieval.
 * All methods are type-safe, production-ready, and rate-limited.
 */
export declare class UserService {
  /**
   * Fetch all PrizePicks entries for a user.
   */
  fetchUserEntries: (userId: string) => Promise<PrizePicksEntry[0]>;
  /**
   * Fetch the user profile for a given userId.
   */
  fetchUserProfile: (userId: string) => Promise<User>;
  /**
   * Update user preferences for a given userId.
   */
  updateUserPreferences: (userId: string, preferences: UserPreferences) => Promise<User>;
}
export declare const userService: UserService;
