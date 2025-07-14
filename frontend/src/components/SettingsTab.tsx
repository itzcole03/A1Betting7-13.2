import React from 'react';
import './A1BettingPreview.css';

/**
 * SettingsTab - Provides user preferences and account management options.
 * Used as the Settings tab in A1BettingPreview.
 *
 * Accessibility: All major sections have ARIA roles and labels for screen readers.
 *
 * @returns {JSX.Element} Settings UI
 */
const SettingsTab: React.FC = (): JSX.Element => (
  <div className='settings-tab' role='tabpanel' aria-label='Settings'>
    <div className='glass-card'>
      <h3 style={{ padding: '20px', color: 'var(--cyber-primary)' }}>⚙️ Settings</h3>
      <div style={{ padding: '20px' }}>
        <div className='glass-card' style={{ marginBottom: 20 }}>
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Preferences</h4>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label>
              <input type='checkbox' defaultChecked /> Enable Dark Mode
            </label>
            <label>
              <input type='checkbox' /> Show Advanced Analytics
            </label>
            <label>
              <input type='checkbox' /> Enable Notifications
            </label>
            <button className='cyber-btn' type='submit' style={{ marginTop: 16 }}>
              Save Settings
            </button>
          </form>
        </div>
        <div className='glass-card'>
          <h4 style={{ color: 'var(--cyber-accent)', padding: '10px 0' }}>Account</h4>
          <div style={{ marginBottom: 10 }}>Manage your account settings and preferences here.</div>
          <button className='cyber-btn' style={{ background: 'var(--risk-red)', color: '#fff' }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default SettingsTab;
