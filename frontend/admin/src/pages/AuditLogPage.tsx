import { Typography } from '@mui/material';
import { Datagrid, DateField, List, TextField } from 'react-admin';

export default function AuditLogPage() {
  return (
    <List>
      <Typography variant='h5' m={2}>
        Audit Log
      </Typography>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <DateField source='timestamp' label='Timestamp' showTime />
        <TextField source='user_id' label='User' />
        <TextField source='action' label='Action' />
        <TextField source='rule_id' label='Rule ID' />
        <TextField source='reason' label='Reason' />
        <TextField source='request_ip' label='IP' />
      </Datagrid>
    </List>
  );
}
