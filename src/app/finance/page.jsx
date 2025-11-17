"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { fetchSettings, updateSetting } from "@/services/v2/settings";

const FINANCE_KEY_PATTERNS = [/^finance\./, /^payout/, /^payments?\./, /^currency\./, /^wallet\./, /^fees?\./, /^tax/]

const normalizeSettings = payload => {
  const toEntries = () => {
    if (Array.isArray(payload)) {
      return payload
    }

    if (payload && typeof payload === 'object') {
      return Object.entries(payload).map(([key, value]) => ({
        key,
        value: value?.value ?? value,
        description: value?.description || ''
      }))
    }

    return []
  }

  const entries = toEntries().filter(entry => {
    if (!entry?.key) return false

    return FINANCE_KEY_PATTERNS.some(pattern => pattern.test(entry.key))
  })

  return entries.map(({ key, value, description }) => ({
    key,
    value: value?.value ?? value,
    description
  }))
};

const FinanceSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [result, setResult] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSettings();

      setSettings(normalizeSettings(data));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setDialogOpen(true);
  };

  const handleSave = async value => {
    setResult(null);

    try {
      await updateSetting({ key: selectedSetting.key, value });
      setResult({ type: "success", message: "Setting updated" });
      setDialogOpen(false);
      await loadSettings();
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to update setting" });
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[60dvh]">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={loadSettings}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h5">Finance Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Update payout thresholds, currency defaults, and fee multipliers.
        </Typography>
      </div>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      {!settings.length ? (
        <Alert severity="info">
          No finance-specific settings were found. Manage general provider keys under the System Settings page.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map(setting => (
                    <TableRow key={setting.key}>
                      <TableCell>{setting.key}</TableCell>
                      <TableCell>{JSON.stringify(setting.value)}</TableCell>
                      <TableCell>{setting.description || "—"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleEdit(setting)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <SettingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        setting={selectedSetting}
      />
    </Stack>
  );
};

const SettingDialog = ({ open, onClose, onSave, setting }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(setting ? JSON.stringify(setting.value, null, 2) : "");
  }, [setting]);

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(value);

      onSave(parsed);
    } catch (err) {
      alert("Value must be valid JSON");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Setting</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {setting?.key}
        </Typography>
        <TextField
          label="Value (JSON)"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          multiline
          minRows={4}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinanceSettingsPage;
