// DELETED: Legacy AdminDashboard navigation test removed as part of canonicalization.
        email: 'admin@example.com',
        roles: ['admin'],
        customPermissions: [],
        deniedPermissions: [],
        isActive: true,
      },
      isAuthenticated: true,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      canManageUser: () => true,
      getUserRoles: () => ['admin'],
      getHighestRole: () => 'admin',
      getAllPermissions: () => ['admin.user_management'],
      isSuperAdmin: () => false,
      isAdminUser: () => true,
      canAccessAdminDashboard: () => true,
      canViewAnalytics: () => true,
      canManageUsers: () => true,
      canPlaceTrades: () => true,
      canUseAdvancedAI: () => true,
    });
    __mockAssign.mockClear();
    render(React.createElement(_AuthProvider, null, React.createElement(AdminDashboard, null)));
    // Simulate the loading delay
    await act(async () => {
      jest.runAllTimers();
    });
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Exit|Exit Admin Mode/i })).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
    const _exitButton = screen.getByRole('button', { name: /Exit|Exit Admin Mode/i });
    // Debug log: button found
    // eslint-disable-next-line no-console
    console.log('DEBUG: Exit button found:', _exitButton ? 'yes' : 'no');
    await userEvent.click(_exitButton);
    // Debug log: button clicked
    // eslint-disable-next-line no-console
    console.log('DEBUG: Exit button clicked');
    // Wait for assign to be called
    await waitFor(() => expect(__mockAssign).toHaveBeenCalledWith('/'), { timeout: 5000 });
  }, 15000);

  it('handles back to dashboard button in access denied state', async () => {
    // Set up AuthContext and permissions mocks for denied state
    const authMockModule = require('../../contexts/AuthContext');
    if (authMockModule.__setAuthUser) {
      authMockModule.__setAuthUser(null, false);
    }
    permissionsMock.mockReturnValue({
      userPermissions: null,
      isAuthenticated: false,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      canManageUser: () => false,
      getUserRoles: () => [],
      getHighestRole: () => null,
      getAllPermissions: () => [],
      isSuperAdmin: () => false,
      isAdminUser: () => false,
      canAccessAdminDashboard: () => false,
      canViewAnalytics: () => false,
      canManageUsers: () => false,
      canPlaceTrades: () => false,
      canUseAdvancedAI: () => false,
    });
    __mockAssign.mockClear();
    render(React.createElement(_AuthProvider, null, React.createElement(AdminDashboard, null)));
    const _backButton = screen.getByRole('button', { name: /Back to Dashboard/i });
    // Debug log: back button found
    // eslint-disable-next-line no-console
    console.log('DEBUG: Back to Dashboard button found:', _backButton ? 'yes' : 'no');
    await userEvent.click(_backButton);
    // Debug log: back button clicked
    // eslint-disable-next-line no-console
    console.log('DEBUG: Back to Dashboard button clicked');
    // Wait for assign to be called
    await waitFor(() => expect(__mockAssign).toHaveBeenCalledWith('/'), { timeout: 5000 });
    expect(_backButton).toBeInTheDocument();
  }, 15000);
});
