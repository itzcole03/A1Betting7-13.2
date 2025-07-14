// frontend/src/services/AuthService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth'; // Assuming the backend is running on port 8000

// Define the types that AuthContext.tsx expects
export interface User {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface PasswordChangeRequest {
  userId: string;
  oldPassword?: string;
  newPassword?: string;
}

class AuthService {
  private user: User | null = null;
  private token: string | null = null;
  private requiresPasswordChangeFlag = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.token = token;
      this.user = JSON.parse(user);
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  private saveToLocalStorage(token: string, user: User) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearLocalStorage() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  requiresPasswordChange(): boolean {
    return this.requiresPasswordChangeFlag;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await axios.post(`${API_URL}/token`, {
      username: email,
      password,
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: (data) => {
            return new URLSearchParams(data).toString()
        }
    });

    if (response.data.access_token) {
        // A real implementation would fetch user details after getting the token
        const user: User = { id: '1', email, role: 'admin' }; // Mock user
        this.saveToLocalStorage(response.data.access_token, user);
        return { success: true, user, requiresPasswordChange: false };
    }
    return { success: false, message: 'Invalid credentials' };
  }

  async logout(): Promise<void> {
    this.clearLocalStorage();
    return Promise.resolve();
  }

  async changePassword(data: PasswordChangeRequest): Promise<any> {
    // This is a placeholder. A real implementation would make an API call.
    console.log(`Changing password for user ${data.userId}`);
    this.requiresPasswordChangeFlag = false;
    return Promise.resolve({ success: true });
  }
}

export const authService = new AuthService();
