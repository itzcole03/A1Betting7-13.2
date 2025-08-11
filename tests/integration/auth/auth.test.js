// Authentication Integration Tests for Phase 4.2
const IntegrationTestFramework = require('../utils/TestFramework');

describe('Authentication API Integration Tests', () => {
  let framework;

  beforeAll(async () => {
    framework = new IntegrationTestFramework();
    // Note: We don't call setupAuthentication here since we're testing auth endpoints
  }, 30000);

  afterAll(async () => {
    await framework.cleanup();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const testUser = {
        username: `test_user_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      const result = await framework.testEndpoint('auth', 
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.response).toHaveProperty('user');
      expect(result.response.user.username).toBe(testUser.username);
      expect(result.response.user.email).toBe(testUser.email);
      expect(result.response).not.toHaveProperty('password');
    });

    it('should reject registration with invalid email', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'TestPassword123!',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: invalidUser }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: weakPasswordUser }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });

    it('should reject duplicate username registration', async () => {
      const testUser = {
        username: 'duplicate_test_user',
        email: 'duplicate1@example.com',
        password: 'TestPassword123!',
      };

      // First registration
      await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );

      // Duplicate registration with same username
      const duplicateUser = {
        ...testUser,
        email: 'duplicate2@example.com',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: duplicateUser }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(409);
    });
  });

  describe('User Login', () => {
    let testUser;

    beforeAll(async () => {
      testUser = {
        username: `login_test_user_${Date.now()}`,
        email: `login_test_${Date.now()}@example.com`,
        password: 'LoginTestPassword123!',
      };

      // Register user for login tests
      await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        username: testUser.username,
        password: testUser.password,
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: credentials }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('access_token');
      expect(result.response).toHaveProperty('user');
      expect(result.response.user.username).toBe(testUser.username);
      expect(typeof result.response.access_token).toBe('string');
    });

    it('should reject login with invalid username', async () => {
      const invalidCredentials = {
        username: 'nonexistent_user',
        password: testUser.password,
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: invalidCredentials }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject login with invalid password', async () => {
      const invalidCredentials = {
        username: testUser.username,
        password: 'wrong_password',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: invalidCredentials }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });

    it('should reject login with missing credentials', async () => {
      const incompleteCredentials = {
        username: testUser.username,
        // Missing password
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: incompleteCredentials }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Protected Endpoints', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
      testUser = {
        username: `protected_test_user_${Date.now()}`,
        email: `protected_test_${Date.now()}@example.com`,
        password: 'ProtectedTestPassword123!',
      };

      // Register and login user
      await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );

      const loginResult = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: { username: testUser.username, password: testUser.password } }
      );

      authToken = loginResult.response.access_token;
      framework.authToken = authToken;
    });

    it('should access user profile with valid token', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'GET', path: '/me', requiresAuth: true }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('user');
      expect(result.response.user.username).toBe(testUser.username);
    });

    it('should reject access without token', async () => {
      const originalToken = framework.authToken;
      framework.authToken = null;

      const result = await framework.testEndpoint('auth',
        { method: 'GET', path: '/me', requiresAuth: true }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);

      framework.authToken = originalToken;
    });

    it('should reject access with invalid token', async () => {
      const originalToken = framework.authToken;
      framework.authToken = 'invalid_token';

      const result = await framework.testEndpoint('auth',
        { method: 'GET', path: '/me', requiresAuth: true }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);

      framework.authToken = originalToken;
    });

    it('should update user profile with valid data', async () => {
      const updateData = {
        email: `updated_${Date.now()}@example.com`,
      };

      const result = await framework.testEndpoint('auth',
        { method: 'PUT', path: '/profile', requiresAuth: true },
        { body: updateData }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response.user.email).toBe(updateData.email);
    });

    it('should change password with valid current password', async () => {
      const passwordData = {
        current_password: testUser.password,
        new_password: 'NewTestPassword123!',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/change-password', requiresAuth: true },
        { body: passwordData }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);

      // Update test user password for future tests
      testUser.password = passwordData.new_password;
    });

    it('should reject password change with wrong current password', async () => {
      const passwordData = {
        current_password: 'wrong_current_password',
        new_password: 'AnotherNewPassword123!',
      };

      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/change-password', requiresAuth: true },
        { body: passwordData }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });
  });

  describe('Token Refresh', () => {
    let refreshToken;
    let testUser;

    beforeAll(async () => {
      testUser = {
        username: `refresh_test_user_${Date.now()}`,
        email: `refresh_test_${Date.now()}@example.com`,
        password: 'RefreshTestPassword123!',
      };

      // Register and login user
      await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );

      const loginResult = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: { username: testUser.username, password: testUser.password } }
      );

      refreshToken = loginResult.response.refresh_token;
      framework.authToken = loginResult.response.access_token;
    });

    it('should refresh token with valid refresh token', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/refresh', requiresAuth: true },
        { body: { refresh_token: refreshToken } }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('access_token');
      expect(typeof result.response.access_token).toBe('string');
    });

    it('should reject refresh with invalid refresh token', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/refresh', requiresAuth: true },
        { body: { refresh_token: 'invalid_refresh_token' } }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('Password Reset Flow', () => {
    let testUser;

    beforeAll(async () => {
      testUser = {
        username: `reset_test_user_${Date.now()}`,
        email: `reset_test_${Date.now()}@example.com`,
        password: 'ResetTestPassword123!',
      };

      // Register user for password reset tests
      await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );
    });

    it('should initiate password reset with valid email', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/reset-password', requiresAuth: false },
        { body: { email: testUser.email } }
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.response).toHaveProperty('message');
    });

    it('should handle password reset request for non-existent email', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/reset-password', requiresAuth: false },
        { body: { email: 'nonexistent@example.com' } }
      );

      // Should return success even for non-existent email (security best practice)
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    it('should reject password reset with invalid email format', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/reset-password', requiresAuth: false },
        { body: { email: 'invalid-email-format' } }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Email Verification', () => {
    it('should handle email verification with token', async () => {
      const mockToken = 'mock_verification_token';
      
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/verify-email', requiresAuth: false },
        { body: { token: mockToken } }
      );

      // This will likely fail in test environment, but we test the endpoint structure
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject verification without token', async () => {
      const result = await framework.testEndpoint('auth',
        { method: 'POST', path: '/verify-email', requiresAuth: false },
        { body: {} }
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(422);
    });
  });

  describe('Performance and Security', () => {
    it('should complete authentication requests within performance thresholds', async () => {
      const testUser = {
        username: `perf_test_user_${Date.now()}`,
        email: `perf_test_${Date.now()}@example.com`,
        password: 'PerfTestPassword123!',
      };

      // Test registration performance
      const registrationResult = await framework.testEndpoint('auth',
        { method: 'POST', path: '/register', requiresAuth: false },
        { body: testUser }
      );

      expect(registrationResult.duration).toBeLessThan(framework.config.performance.responseTime.auth);

      // Test login performance
      const loginResult = await framework.testEndpoint('auth',
        { method: 'POST', path: '/login', requiresAuth: false },
        { body: { username: testUser.username, password: testUser.password } }
      );

      expect(loginResult.duration).toBeLessThan(framework.config.performance.responseTime.auth);
    });

    it('should handle rate limiting appropriately', async () => {
      const credentials = {
        username: 'rate_limit_test',
        password: 'wrong_password',
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, () =>
        framework.testEndpoint('auth',
          { method: 'POST', path: '/login', requiresAuth: false },
          { body: credentials }
        )
      );

      const results = await Promise.all(requests);
      
      // Should have some rate-limited responses
      const rateLimitedResponses = results.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
