/**
 * UserInvitationService - Handles user invitations sent by admins
 */

import { Role } from './PermissionService';
import { emailNotificationService } from './EmailNotificationService';

export interface UserInvitation {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
  acceptedAt?: Date;
  tempPassword?: string;
}

export interface InvitationRequest {
  email: string;
  role: Role;
  message?: string;
  expiresInDays?: number; // defaults to 7
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  invitationId?: string;
}

class UserInvitationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
  }

  /**
   * Send a user invitation (admin only)
   */
  async sendInvitation(
    data: InvitationRequest,
    authToken: string,
    adminEmail: string
  ): Promise<InvitationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: data.email.toLowerCase().trim(),
          role: data.role,
          message: data.message?.trim(),
          invitedBy: adminEmail,
          expiresInDays: data.expiresInDays || 7,
          invitedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send invitation:', error);

      // For demo purposes, simulate success
      if (process.env.NODE_ENV === 'development') {
        return this.simulateInvitation(data, adminEmail);
      }

      throw error;
    }
  }

  /**
   * Get all invitations (admin only)
   */
  async getAllInvitations(authToken: string): Promise<UserInvitation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/invitations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch invitations:', error);

      // For demo purposes, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockInvitations();
      }

      throw error;
    }
  }

  /**
   * Cancel an invitation (admin only)
   */
  async cancelInvitation(invitationId: string, authToken: string): Promise<InvitationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/invitations/${invitationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to cancel invitation:', error);

      // For demo purposes, simulate success
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'Invitation cancelled successfully',
        };
      }

      throw error;
    }
  }

  /**
   * Resend an invitation (admin only)
   */
  async resendInvitation(invitationId: string, authToken: string): Promise<InvitationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to resend invitation:', error);

      // For demo purposes, simulate success
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'Invitation resent successfully',
        };
      }

      throw error;
    }
  }

  /**
   * Accept an invitation (public endpoint)
   */
  async acceptInvitation(
    invitationId: string,
    email: string,
    password: string
  ): Promise<InvitationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          acceptedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw error;
    }
  }

  /**
   * Get invitation details by ID (public endpoint)
   */
  async getInvitationDetails(invitationId: string): Promise<UserInvitation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/invitations/${invitationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null; // Invitation not found
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get invitation details:', error);
      throw error;
    }
  }

  /**
   * Check if email is already invited
   */
  async checkExistingInvitation(email: string, authToken: string): Promise<UserInvitation | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin/invitations/check/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 404) {
        return null; // No existing invitation
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check existing invitation:', error);

      // For demo purposes, return null (no existing invitation)
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      throw error;
    }
  }

  /**
   * Generate invitation URL
   */
  generateInvitationUrl(invitationId: string): string {
    return `${window.location.origin}/invite/${invitationId}`;
  }

  /**
   * Check if invitation is expired
   */
  isInvitationExpired(invitation: UserInvitation): boolean {
    return new Date() > invitation.expiresAt;
  }

  /**
   * Generate temporary password for invitation
   */
  generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Demo simulation methods for development
   */
  private async simulateInvitation(
    data: InvitationRequest,
    adminEmail: string
  ): Promise<InvitationResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invitationUrl = this.generateInvitationUrl(invitationId);

    // Simulate sending invitation email
    console.log('📧 [DEMO] User Invitation Email:', {
      to: data.email,
      role: data.role,
      invitedBy: adminEmail,
      invitationUrl,
      message: data.message,
      expiresInDays: data.expiresInDays || 7,
    });

    // In a real implementation, this would send an email with the invitation link
    await emailNotificationService.notifyUserOfInvitation({
      userEmail: data.email,
      role: data.role,
      invitedBy: adminEmail,
      invitationUrl,
      message: data.message,
      expiresInDays: data.expiresInDays || 7,
    });

    return {
      success: true,
      message: `Invitation sent successfully to ${data.email}`,
      invitationId,
    };
  }

  private getMockInvitations(): UserInvitation[] {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'inv_001',
        email: 'analyst@example.com',
        role: 'analyst',
        invitedBy: 'cole@example.com',
        invitedAt: threeDaysAgo,
        expiresAt: new Date(threeDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        message: 'Welcome to the analytics team!',
      },
      {
        id: 'inv_002',
        email: 'trader@example.com',
        role: 'trader',
        invitedBy: 'cole@example.com',
        invitedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        acceptedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        tempPassword: 'TempPass123',
      },
      {
        id: 'inv_003',
        email: 'expired@example.com',
        role: 'user',
        invitedBy: 'cole@example.com',
        invitedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        status: 'expired',
      },
    ];
  }
}

// Export singleton instance
export const userInvitationService = new UserInvitationService();

// Export class for testing
export default UserInvitationService;
