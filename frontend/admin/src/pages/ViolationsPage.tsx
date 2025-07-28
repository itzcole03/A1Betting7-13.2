import { Typography } from '@mui/material';
import { Datagrid, DateField, List, TextField } from 'react-admin';

export default function ViolationsPage() {
  return (
    <List>
      <Typography variant='h5' m={2}>
        Recent Violations
      </Typography>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <DateField source='timestamp' label='Timestamp' showTime />
        <TextField source='user_id' label='User' />
        <TextField source='violation' label='Violation' />
        <TextField source='details' label='Details' />
      </Datagrid>
    </List>
  );
}
