/**
 * AdminPanel component for the UltimateSportsBettingApp.
 *
 * Provides an administrative interface for managing users, viewing system logs, and monitoring system statistics.
 * Accessible only to authorized admin users. Utilizes React Query for data fetching and Framer Motion for animations.
 */
import React from 'react.ts';
/**
 * AdminPanel component provides an administrative interface for managing users, viewing system logs, and monitoring system statistics.
 *
 * Props: None;
 *
 * State:
 * - activeTab: Controls which admin tab is active ('users', 'logs', or 'stats').
 * - searchQuery: Filters the user list by name or email.
 *
 * Behavior:
 * - Fetches users, logs, and system metrics using React Query.
 * - Allows admin to update user status (active/suspended).
 * - Displays system logs and key system metrics.
 */
declare const AdminPanel: React.FC;
export default AdminPanel;
