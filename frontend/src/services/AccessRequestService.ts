/**
 * AccessRequestService - Handles user access requests and approval workflow
 */

export interface AccessRequest {
  id: string;
  email: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: Date;
  deniedReason?: string;
  tempPassword?: string;
  isFirstLogin?: boolean;
}

export interface AccessRequestSubmission {
  email: string;
  message?: string;
}

export interface AccessRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

class AccessRequestService {
  private baseUrl: string;

  constructor() {
    // In production, this would come from environment variables
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Submit an access request
   */
  async submitAccessRequest(data: AccessRequestSubmission): Promise<AccessRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/access-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.toLowerCase().trim(),
          message: data.message?.trim(),
          requestedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to submit access request:', error);

      // For demo purposes, simulate success
      if (import.meta.env.DEV) {
        return this.simulateAccessRequest(data);
      }

      throw error;
    }
  }

  /**
   * Check if email already has a pending request
   */
  async checkExistingRequest(email: string): Promise<AccessRequest | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/access-requests/check/${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 404) {
        return null; // No existing request
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check existing request:', error);

      // For demo purposes, return null (no existing request)
      if (import.meta.env.DEV) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Get all access requests (admin only)
   */
  async getAllAccessRequests(authToken: string): Promise<AccessRequest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/access-requests`, {
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
      console.error('Failed to fetch access requests:', error);

      // For demo purposes, return mock data
      if (import.meta.env.DEV) {
        return this.getMockAccessRequests();
      }

      throw error;
    }
  }

  /**
   * Approve an access request (admin only)
   */
  async approveAccessRequest(
    requestId: string,
    authToken: string,
    adminEmail: string
  ): Promise<AccessRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          approvedBy: adminEmail,
          approvedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to approve access request:', error);

      // For demo purposes, simulate success
      if (import.meta.env.DEV) {
        return {
          success: true,
          message:
            'Access request approved successfully. User will receive email with login credentials.',
        };
      }

      throw error;
    }
  }

  /**
   * Deny an access request (admin only)
   */
  async denyAccessRequest(
    requestId: string,
    authToken: string,
    adminEmail: string,
    reason?: string
  ): Promise<AccessRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/access-requests/${requestId}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deniedBy: adminEmail,
          deniedAt: new Date().toISOString(),
          deniedReason: reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to deny access request:', error);

      // For demo purposes, simulate success
      if (import.meta.env.DEV) {
        return {
          success: true,
          message: 'Access request denied. User will be notified via email.',
        };
      }

      throw error;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate temporary password
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
  private async simulateAccessRequest(
    data: AccessRequestSubmission
  ): Promise<AccessRequestResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate sending email notification to admin
    console.log('🔔 [DEMO] Access Request Notification:', {
      email: data.email,
      message: data.message,
      timestamp: new Date().toISOString(),
      notifyAdmin: 'cole@example.com',
    });

    return {
      success: true,
      message:
        'Access request submitted successfully! You will receive an email once your request is reviewed.',
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private getMockAccessRequests(): AccessRequest[] {
    return [
      {
        id: 'req_001',
        email: 'user1@example.com',
        requestedAt: new Date(Date.now() - 86400000), // 1 day ago
        status: 'pending',
      },
      {
        id: 'req_002',
        email: 'user2@example.com',
        requestedAt: new Date(Date.now() - 172800000), // 2 days ago
        status: 'approved',
        approvedBy: 'cole@example.com',
        approvedAt: new Date(Date.now() - 86400000),
        tempPassword: 'TempPass123',
        isFirstLogin: true,
      },
      {
        id: 'req_003',
        email: 'spam@example.com',
        requestedAt: new Date(Date.now() - 259200000), // 3 days ago
        status: 'denied',
        approvedBy: 'cole@example.com',
        approvedAt: new Date(Date.now() - 172800000),
        deniedReason: 'Invalid business email domain',
      },
    ];
  }
}

// Export singleton instance
export const accessRequestService = new AccessRequestService();

// Export class for testing
export default AccessRequestService;
