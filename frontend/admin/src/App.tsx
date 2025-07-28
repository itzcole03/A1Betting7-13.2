import { Box, CssBaseline, Typography } from '@mui/material';
import { useState } from 'react';
import { Admin, AppBar, Layout, Resource, TitlePortal } from 'react-admin';
import authProvider from './authProvider';
import dataProvider from './dataProvider';
import AuditLogPage from './pages/AuditLogPage';
import RulesPage from './pages/RulesPage';
import ViolationsPage from './pages/ViolationsPage';

const CustomAppBar = () => (
  <AppBar>
    <TitlePortal />
    <Typography variant='h6' sx={{ flex: 1, ml: 2 }}>
      Rule Management Admin
    </Typography>
  </AppBar>
);

const CustomLayout = (props: any) => <Layout {...props} appBar={CustomAppBar} />;

function App() {
  // Placeholder: show login if not authenticated (to be replaced with real auth)
  const [isAuthenticated] = useState(true); // TODO: wire to authProvider
  if (!isAuthenticated) {
    return (
      <Box display='flex' alignItems='center' justifyContent='center' minHeight='100vh'>
        <Typography variant='h4'>Admin Login (placeholder)</Typography>
      </Box>
    );
  }
  return (
    <>
      <CssBaseline />
      <Admin
        dataProvider={dataProvider}
        authProvider={authProvider}
        layout={CustomLayout}
        title='Rule Management Admin'
      >
        <Resource name='rules' list={RulesPage} options={{ label: 'Business Rules' }} />
        <Resource name='audit-log' list={AuditLogPage} options={{ label: 'Audit Log' }} />
        <Resource name='violations' list={ViolationsPage} options={{ label: 'Violations' }} />
      </Admin>
    </>
  );
}

export default App;
