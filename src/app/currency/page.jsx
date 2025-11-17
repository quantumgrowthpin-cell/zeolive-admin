"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Refresh, Star, StarBorder } from "@mui/icons-material";

import {
  fetchCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  setDefaultCurrency,
} from "@/services/v2/currency";

const defaultForm = {
  name: "",
  symbol: "",
  currencyCode: "USD",
  countryCode: "",
  isActive: true,
};

const codes = ["USD", "INR", "EUR", "AED", "GBP", "JPY", "SGD"];

const CurrencyDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(initialData || defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData || defaultForm);
  }, [initialData]);

  const handleChange = event => {
    const { name, value, type, checked } = event.target;

    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Unable to save currency");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? "Edit Currency" : "Add Currency"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField label="Name" name="name" value={form.name} onChange={handleChange} />
        <TextField label="Symbol" name="symbol" value={form.symbol} onChange={handleChange} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField select label="Currency Code" name="currencyCode" value={form.currencyCode} onChange={handleChange} fullWidth>
            {codes.map(code => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Country Code" name="countryCode" value={form.countryCode} onChange={handleChange} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">Active</Typography>
          <Switch checked={form.isActive} onChange={handleChange} name="isActive" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CurrencyPage = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, data: null });
  const [pendingAction, setPendingAction] = useState(null);
  const [message, setMessage] = useState(null);

  const loadCurrencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const list = await fetchCurrencies();

      setCurrencies(list);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const handleSubmit = async payload => {
    if (dialog.data) {
      await updateCurrency(dialog.data._id, payload);
      setMessage("Currency updated");
    } else {
      await createCurrency(payload);
      setMessage("Currency added");
    }

    await loadCurrencies();
  };

  const handleDelete = async currency => {
    if (!window.confirm(`Delete ${currency.name}?`)) return;
    setPendingAction(currency._id);

    try {
      await deleteCurrency(currency._id);
      setMessage("Currency deleted");
      await loadCurrencies();
    } finally {
      setPendingAction(null);
    }
  };

  const handleDefault = async currency => {
    setPendingAction(currency._id);

    try {
      await setDefaultCurrency(currency._id);
      setMessage(`${currency.name} set as default`);
      await loadCurrencies();
    } finally {
      setPendingAction(null);
    }
  };

  const summary = useMemo(() => {
    const total = currencies.length;
    const active = currencies.filter(currency => currency.isActive).length;
    const defaultCurrency = currencies.find(currency => currency.isDefault)?.currencyCode || "—";

    return { total, active, defaultCurrency };
  }, [currencies]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[60dvh]">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
        <div>
          <Typography variant="h5">Currencies</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the currencies available for coin plans, payouts, and storefront pricing.
          </Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<Add />} variant="contained" onClick={() => setDialog({ open: true, data: null })}>
            Add Currency
          </Button>
          <IconButton onClick={loadCurrencies}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Active" value={summary.active} />
            <SummaryCard label="Default" value={summary.defaultCurrency} />
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Currency</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Default</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currencies.map(currency => (
              <TableRow key={currency._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {currency.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currency.currencyCode}
                  </Typography>
                </TableCell>
                <TableCell>{currency.symbol || "—"}</TableCell>
                <TableCell>{currency.countryCode || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={currency.isActive ? "Active" : "Inactive"}
                    color={currency.isActive ? "success" : "default"}
                  />
                </TableCell>
                <TableCell>
                  {currency.isDefault ? (
                    <Chip size="small" icon={<Star fontSize="inherit" />} label="Default" color="warning" />
                  ) : (
                    <Tooltip title="Set as default">
                      <span>
                        <IconButton onClick={() => handleDefault(currency)} disabled={pendingAction === currency._id}>
                          <StarBorder fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setDialog({ open: true, data: currency })}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(currency)} disabled={pendingAction === currency._id}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!currencies.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No currencies configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CurrencyDialog
        open={dialog.open}
        initialData={dialog.data}
        onClose={() => setDialog({ open: false, data: null })}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
};

const SummaryCard = ({ label, value }) => (
  <Box sx={{ borderRadius: 2, border: theme => `1px solid ${theme.palette.divider}`, px: 2, py: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Box>
);

export default CurrencyPage;
