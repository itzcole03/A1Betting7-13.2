/**
 * EmailNotificationService - Handles email notifications for access requests
 * In production, this would integrate with a real email service like SendGrid, AWS SES, or similar
 */

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface AccessRequestNotification {
  adminEmail: string;
  userEmail: string;
  requestId: string;
  message?: string;
}

export interface AccessApprovalNotification {
  userEmail: string;
  tempPassword: string;
  loginUrl: string;
}

export interface AccessDenialNotification {
  userEmail: string;
  reason?: string;
}

export interface UserInvitationNotification {
  userEmail: string;
  role: string;
  invitedBy: string;
  invitationUrl: string;
  message?: string;
  expiresInDays: number;
}

class EmailNotificationService {
  private baseUrl: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_EMAIL_API_URL || '/api/email';
    this.fromEmail = process.env.REACT_APP_FROM_EMAIL || 'noreply@a1betting.com';
    this.fromName = process.env.REACT_APP_FROM_NAME || 'A1 Betting Platform';
  }

  /**
   * Send email notification to admin about new access request
   */
  async notifyAdminOfAccessRequest(data: AccessRequestNotification): Promise<boolean> {
    const template = this.createAccessRequestTemplate(data);

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: this.fromEmail, name: this.fromName },
          to: data.adminEmail,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          tags: ['access-request', 'admin-notification'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send admin notification:', error);

      // For development, log the email that would be sent
      if (process.env.NODE_ENV === 'development') {
        this.logEmailForDevelopment('Admin Access Request Notification', template);
        return true;
      }

      return false;
    }
  }

  /**
   * Send approval notification to user with temporary password
   */
  async notifyUserOfApproval(data: AccessApprovalNotification): Promise<boolean> {
    const template = this.createApprovalTemplate(data);

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: this.fromEmail, name: this.fromName },
          to: data.userEmail,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          tags: ['access-approved', 'user-notification'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send approval notification:', error);

      // For development, log the email that would be sent
      if (process.env.NODE_ENV === 'development') {
        this.logEmailForDevelopment('User Approval Notification', template);
        return true;
      }

      return false;
    }
  }

  /**
   * Send invitation notification to user
   */
  async notifyUserOfInvitation(data: UserInvitationNotification): Promise<boolean> {
    const template = this.createInvitationTemplate(data);

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: this.fromEmail, name: this.fromName },
          to: data.userEmail,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          tags: ['invitation', 'user-notification'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send invitation notification:', error);

      // For development, log the email that would be sent
      if (process.env.NODE_ENV === 'development') {
        this.logEmailForDevelopment('User Invitation Notification', template);
        return true;
      }

      return false;
    }
  }

  /**
   * Send denial notification to user
   */
  async notifyUserOfDenial(data: AccessDenialNotification): Promise<boolean> {
    const template = this.createDenialTemplate(data);

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: this.fromEmail, name: this.fromName },
          to: data.userEmail,
          subject: template.subject,
          html: template.htmlContent,
          text: template.textContent,
          tags: ['access-denied', 'user-notification'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send denial notification:', error);

      // For development, log the email that would be sent
      if (process.env.NODE_ENV === 'development') {
        this.logEmailForDevelopment('User Denial Notification', template);
        return true;
      }

      return false;
    }
  }

  /**
   * Create email template for admin access request notification
   */
  private createAccessRequestTemplate(data: AccessRequestNotification): EmailTemplate {
    const subject = `New Access Request - ${data.userEmail}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06ffa5, #00d4ff); padding: 20px; text-align: center; color: #000; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { background: #06ffa5; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
          .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Access Request</h1>
          </div>
          <div class="content">
            <h2>A1 Betting Platform Access Request</h2>
            <p><strong>User Email:</strong> ${data.userEmail}</p>
            <p><strong>Request ID:</strong> ${data.requestId}</p>
            <p><strong>Requested:</strong> ${new Date().toLocaleString()}</p>
            ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ''}
            
            <p>Please review this access request and take appropriate action:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${this.getAdminDashboardUrl()}" class="button">Review in Admin Dashboard</a>
            </div>
            
            <p><em>You can approve or deny this request directly from your admin dashboard.</em></p>
          </div>
          <div class="footer">
            A1 Betting Platform - Admin Notification System<br>
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
New Access Request - A1 Betting Platform

User Email: ${data.userEmail}
Request ID: ${data.requestId}
Requested: ${new Date().toLocaleString()}
${data.message ? `Message: ${data.message}` : ''}

Please review this access request in your admin dashboard: ${this.getAdminDashboardUrl()}

You can approve or deny this request directly from your admin dashboard.

---
A1 Betting Platform - Admin Notification System
This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.adminEmail,
      subject,
      htmlContent,
      textContent,
    };
  }

  /**
   * Create email template for user approval notification
   */
  private createApprovalTemplate(data: AccessApprovalNotification): EmailTemplate {
    const subject = 'Access Approved - Welcome to A1 Betting Platform';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06ffa5, #00d4ff); padding: 20px; text-align: center; color: #000; }
          .content { background: #f9f9f9; padding: 20px; }
          .credentials { background: #e8f5e8; border: 1px solid #06ffa5; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { background: #06ffa5; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; color: #856404; }
          .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to A1 Betting Platform!</h1>
          </div>
          <div class="content">
            <h2>Your Access Request Has Been Approved</h2>
            <p>Congratulations! Your access request has been approved. You now have access to the A1 Betting Platform.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials</h3>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This is a temporary password. You will be required to change it on your first login for security purposes.
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${data.loginUrl}" class="button">Sign In Now</a>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
              <li>Click the "Sign In Now" button above</li>
              <li>Use your email and the temporary password provided</li>
              <li>You'll be prompted to create a new password</li>
              <li>Start exploring the platform's features!</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
          </div>
          <div class="footer">
            A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence<br>
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to A1 Betting Platform!

Your Access Request Has Been Approved

Congratulations! Your access request has been approved. You now have access to the A1 Betting Platform.

YOUR LOGIN CREDENTIALS:
Email: ${data.userEmail}
Temporary Password: ${data.tempPassword}

IMPORTANT: This is a temporary password. You will be required to change it on your first login for security purposes.

Sign in now: ${data.loginUrl}

What's Next?
1. Click the sign in link above
2. Use your email and the temporary password provided
3. You'll be prompted to create a new password
4. Start exploring the platform's features!

If you have any questions or need assistance, please contact our support team.

---
A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence
This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.userEmail,
      subject,
      htmlContent,
      textContent,
    };
  }

  /**
   * Create email template for user invitation
   */
  private createInvitationTemplate(data: UserInvitationNotification): EmailTemplate {
    const subject = `Invitation to join A1 Betting Platform`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06ffa5, #00d4ff); padding: 20px; text-align: center; color: #000; }
          .content { background: #f9f9f9; padding: 20px; }
          .invitation-box { background: #e8f5e8; border: 1px solid #06ffa5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { background: #06ffa5; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 4px; color: #856404; margin: 15px 0; }
          .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
          </div>
          <div class="content">
            <h2>Join A1 Betting Platform</h2>
            <p>Hi there!</p>
            <p>You've been invited by <strong>${data.invitedBy}</strong> to join the A1 Betting Platform as a <strong>${data.role}</strong>.</p>

            ${
              data.message
                ? `
            <div class="invitation-box">
              <h3>Personal Message:</h3>
              <p><em>"${data.message}"</em></p>
            </div>
            `
                : ''
            }

            <p>A1 Betting Platform is an advanced AI-powered sports betting intelligence system that provides:</p>
            <ul>
              <li>Advanced analytics and predictions</li>
              <li>Real-time arbitrage opportunities</li>
              <li>Professional trading tools</li>
              <li>Risk management systems</li>
              <li>AI-powered insights</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
            </div>

            <div class="warning">
              <strong>Important:</strong> This invitation expires in ${data.expiresInDays} days. Click the button above to accept and create your account.
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #06ffa5;">${data.invitationUrl}</p>

            <p>If you have any questions, feel free to contact the person who invited you or our support team.</p>
          </div>
          <div class="footer">
            A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence<br>
            This invitation was sent by ${data.invitedBy}
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
You're Invited to Join A1 Betting Platform!

Hi there!

You've been invited by ${data.invitedBy} to join the A1 Betting Platform as a ${data.role}.

${data.message ? `Personal Message: "${data.message}"` : ''}

A1 Betting Platform is an advanced AI-powered sports betting intelligence system that provides:
- Advanced analytics and predictions
- Real-time arbitrage opportunities
- Professional trading tools
- Risk management systems
- AI-powered insights

To accept this invitation, visit: ${data.invitationUrl}

IMPORTANT: This invitation expires in ${data.expiresInDays} days.

If you have any questions, feel free to contact ${data.invitedBy} or our support team.

---
A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence
This invitation was sent by ${data.invitedBy}
    `;

    return {
      to: data.userEmail,
      subject,
      htmlContent,
      textContent,
    };
  }

  /**
   * Create email template for user denial notification
   */
  private createDenialTemplate(data: AccessDenialNotification): EmailTemplate {
    const subject = 'Access Request Update - A1 Betting Platform';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; padding: 20px; text-align: center; color: #fff; }
          .content { background: #f9f9f9; padding: 20px; }
          .reason { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 15px 0; color: #721c24; }
          .button { background: #06ffa5; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .footer { background: #333; color: #fff; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Access Request Update</h1>
          </div>
          <div class="content">
            <h2>A1 Betting Platform Access Request</h2>
            <p>Thank you for your interest in the A1 Betting Platform. After careful review, we are unable to approve your access request at this time.</p>
            
            ${
              data.reason
                ? `
            <div class="reason">
              <h3>Reason:</h3>
              <p>${data.reason}</p>
            </div>
            `
                : ''
            }
            
            <p>If you believe this decision was made in error or if your circumstances have changed, you may submit a new access request in the future.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${this.getRequestAccessUrl()}" class="button">Submit New Request</a>
            </div>
            
            <p>If you have any questions about this decision, please contact our support team.</p>
          </div>
          <div class="footer">
            A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence<br>
            This is an automated message. Please do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
A1 Betting Platform - Access Request Update

Thank you for your interest in the A1 Betting Platform. After careful review, we are unable to approve your access request at this time.

${data.reason ? `Reason: ${data.reason}` : ''}

If you believe this decision was made in error or if your circumstances have changed, you may submit a new access request in the future.

Submit a new request: ${this.getRequestAccessUrl()}

If you have any questions about this decision, please contact our support team.

---
A1 Betting Platform - Advanced AI-Powered Sports Betting Intelligence
This is an automated message. Please do not reply to this email.
    `;

    return {
      to: data.userEmail,
      subject,
      htmlContent,
      textContent,
    };
  }

  /**
   * Get admin dashboard URL
   */
  private getAdminDashboardUrl(): string {
    return `${window.location.origin}/admin`;
  }

  /**
   * Get request access URL
   */
  private getRequestAccessUrl(): string {
    return `${window.location.origin}/auth`;
  }

  /**
   * Log email for development purposes
   */
  private logEmailForDevelopment(type: string, template: EmailTemplate): void {
    console.log(`
📧 [EMAIL NOTIFICATION - ${type}]
To: ${template.to}
Subject: ${template.subject}

${template.textContent}

---
HTML content would be rendered with styling in production.
    `);
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();

// Export class for testing
export default EmailNotificationService;
