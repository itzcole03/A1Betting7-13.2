import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import {
  Datagrid,
  DateField,
  List,
  Pagination,
  TextField as RATextField,
  useListContext,
} from 'react-admin';

const actionOptions = ['', 'create', 'update', 'delete', 'rollback', 'approve', 'reject'];

function AuditLogFilters() {
  const { filterValues, setFilters } = useListContext();
  const [user, setUser] = useState(filterValues.user_id || '');
  const [action, setAction] = useState(filterValues.action || '');
  const [ruleId, setRuleId] = useState(filterValues.rule_id || '');
  const [startTime, setStartTime] = useState(filterValues.start_time || '');
  const [endTime, setEndTime] = useState(filterValues.end_time || '');

  const applyFilters = () => {
    setFilters(
      {
        user_id: user,
        action,
        rule_id: ruleId,
        start_time: startTime,
        end_time: endTime,
      },
      {}
    );
  };

  return (
    <Box display='flex' gap={2} flexWrap='wrap' mb={2}>
      <TextField label='User' value={user} onChange={e => setUser(e.target.value)} size='small' />
      <TextField
        label='Action'
        value={action}
        onChange={e => setAction(e.target.value)}
        select
        size='small'
        sx={{ minWidth: 120 }}
      >
        {actionOptions.map(opt => (
          <MenuItem key={opt} value={opt}>
            {opt || 'Any'}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label='Rule ID'
        value={ruleId}
        onChange={e => setRuleId(e.target.value)}
        size='small'
      />
      <TextField
        label='Start Time'
        type='datetime-local'
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
        size='small'
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label='End Time'
        type='datetime-local'
        value={endTime}
        onChange={e => setEndTime(e.target.value)}
        size='small'
        InputLabelProps={{ shrink: true }}
      />
      <Button variant='outlined' onClick={applyFilters} sx={{ minWidth: 100 }}>
        Apply
      </Button>
    </Box>
  );
}

export default function AuditLogPage() {
  return (
    <List
      filters={<AuditLogFilters />}
      pagination={<Pagination rowsPerPageOptions={[25, 50, 100, 200]} />}
      perPage={50}
    >
      <Typography variant='h5' m={2}>
        Audit Log
      </Typography>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <DateField source='timestamp' label='Timestamp' showTime />
        <RATextField source='user' label='User' />
        <RATextField source='action' label='Action' />
        <RATextField source='rule_id' label='Rule ID' />
        <RATextField source='reason' label='Reason' />
        <RATextField source='request_ip' label='IP' />
      </Datagrid>
    </List>
  );
}
