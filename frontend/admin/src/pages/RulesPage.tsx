import { DiffEditor } from '@monaco-editor/react';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import axios from 'axios';
import yaml from 'js-yaml';
import { useEffect, useState } from 'react';
import { List, useNotify } from 'react-admin';

const apiUrl = '/api/v1/admin/business-rules';

export default function RulesPage() {
  const [originalYaml, setOriginalYaml] = useState('');
  const [yamlText, setYamlText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const notify = useNotify();

  // Fetch current rules YAML from backend
  useEffect(() => {
    setLoading(true);
    axios
      .get(apiUrl)
      .then(res => {
        const yamlStr = typeof res.data === 'string' ? res.data : yaml.dump(res.data);
        setOriginalYaml(yamlStr);
        setYamlText(yamlStr);
      })
      .catch(() => {
        notify('Failed to load rules from backend', { type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [notify]);

  // Validate YAML on change
  const handleYamlChange = (value?: string) => {
    setYamlText(value || '');
    setError(null);
    try {
      yaml.load(value || '');
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Propose rule change
  const handlePropose = async () => {
    setSubmitting(true);
    try {
      await axios.post(
        apiUrl,
        { yaml: yamlText, reason },
        { headers: { 'Content-Type': 'application/json' } }
      );
      notify('Rule change proposed successfully', { type: 'success' });
      setOriginalYaml(yamlText);
      setReason('');
    } catch (e: any) {
      notify('Failed to propose rule change', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const isChanged = yamlText !== originalYaml;
  const isValid = !error && isChanged && reason.trim().length > 0;

  return (
    <List>
      <Box p={2}>
        <Typography variant='h5' mb={2}>
          Business Rules (YAML)
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <DiffEditor
              height='40vh'
              language='yaml'
              original={originalYaml}
              modified={yamlText}
              options={{ renderSideBySide: true, minimap: { enabled: false } }}
              onMount={(_editor, monaco) => {
                // Attach change handler to the modified (right) editor
                const modifiedEditor = _editor.getModifiedEditor();
                modifiedEditor.onDidChangeModelContent(() => {
                  handleYamlChange(modifiedEditor.getValue());
                });
              }}
            />
            <TextField
              label='Reason for change (required, audit log)'
              value={reason}
              onChange={e => setReason(e.target.value)}
              fullWidth
              margin='normal'
              required
            />
            {error && <Typography color='error'>YAML Error: {error}</Typography>}
            <Button
              variant='contained'
              color='primary'
              sx={{ mt: 2 }}
              disabled={!isValid || submitting}
              onClick={handlePropose}
            >
              {submitting ? <CircularProgress size={24} /> : 'Propose Rule Change'}
            </Button>
          </>
        )}
      </Box>
    </List>
  );
}
