"use client";

import { useEffect, useMemo, useState } from "react";

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
  IconButton,
  MenuItem,
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
import { Add, Edit, History, MonetizationOn, Refresh, ToggleOff, ToggleOn } from "@mui/icons-material";

import {
  listCoinTraders,
  registerCoinTrader,
  adjustTraderBalance,
  updateTraderStatus,
  updateTraderProfile,
  fetchTraderHistory,
} from "@/services/v2/coinTraders";

const CoinTradersPage = () => {
  const [filters, setFilters] = useState({ search: "", startDate: "", endDate: "" });
  const [traders, setTraders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [balanceDialog, setBalanceDialog] = useState({ open: false, trader: null });
  const [profileDialog, setProfileDialog] = useState({ open: false, trader: null });
  const [historyDialog, setHistoryDialog] = useState({ open: false, trader: null });
  const [historyState, setHistoryState] = useState({ loading: false, entries: [], meta: {} });
  const [submitting, setSubmitting] = useState(false);

  const loadTraders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listCoinTraders({
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      setTraders(response.data || []);
      setMeta(response.meta || {});
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load coin traders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTraders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.startDate, filters.endDate]);

  const summary = useMemo(() => {
    const totalCoins = traders.reduce((acc, trader) => acc + (trader.coinBalance || 0), 0);
    const active = traders.filter((trader) => trader.isActive).length;

    
return { total: meta.total || traders.length, totalCoins, active };
  }, [traders, meta]);

  const handleToggleStatus = async (trader) => {
    setSubmitting(true);

    try {
      await updateTraderStatus(trader._id, !trader.isActive);
      await loadTraders();
    } finally {
      setSubmitting(false);
    }
  };

  const openHistory = async (trader) => {
    setHistoryDialog({ open: true, trader });
    setHistoryState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetchTraderHistory(trader._id, { limit: 50 });

      setHistoryState({ loading: false, entries: response.data || [], meta: response.meta || {} });
    } catch (err) {
      setHistoryState({ loading: false, entries: [], meta: {}, error: err?.response?.data?.message || err.message });
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[60dvh]">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
        <div>
          <Typography variant="h5">Coin Traders</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the marketplace operators who buy/sell coins within your ecosystem.
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<Add />} variant="contained" onClick={() => setRegisterOpen(true)}>
            Register Trader
          </Button>
          <IconButton onClick={loadTraders}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Total Traders" value={summary.total} />
        <SummaryCard label="Active Traders" value={summary.active} />
        <SummaryCard label="Coins Under Management" value={summary.totalCoins.toLocaleString()} />
      </Stack>

      <Filters filters={filters} onChange={setFilters} />

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Trader</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Coin Balance</TableCell>
              <TableCell align="right">Spent Coins</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traders.map((trader) => (
              <TableRow key={trader._id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{trader.user?.displayName || trader.user?.username || trader._id}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      UID: {trader.uniqueId}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {trader.countryCode} {trader.mobileNumber || "—"}
                </TableCell>
                <TableCell align="right">{trader.coinBalance?.toLocaleString() || 0}</TableCell>
                <TableCell align="right">{trader.spendCoin?.toLocaleString() || 0}</TableCell>
                <TableCell>{trader.isActive ? "ACTIVE" : "INACTIVE"}</TableCell>
                <TableCell>
                  {new Date(trader.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => openHistory(trader)} title="History">
                      <History fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setBalanceDialog({ open: true, trader })}
                      title="Adjust Balance"
                    >
                      <MonetizationOn fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setProfileDialog({ open: true, trader })} title="Edit Profile">
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={trader.isActive ? "success" : "default"}
                      onClick={() => handleToggleStatus(trader)}
                      disabled={submitting}
                      title={trader.isActive ? "Deactivate" : "Activate"}
                    >
                      {trader.isActive ? <ToggleOn fontSize="inherit" /> : <ToggleOff fontSize="inherit" />}
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!traders.length && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2">No coin traders found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <RegisterDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            await registerCoinTrader(payload);
            setRegisterOpen(false);
            await loadTraders();
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <BalanceDialog
        open={balanceDialog.open}
        trader={balanceDialog.trader}
        onClose={() => setBalanceDialog({ open: false, trader: null })}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            await adjustTraderBalance({ traderId: payload.traderId, amount: payload.amount, type: payload.type, note: payload.note });
            setBalanceDialog({ open: false, trader: null });
            await loadTraders();
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <ProfileDialog
        open={profileDialog.open}
        trader={profileDialog.trader}
        onClose={() => setProfileDialog({ open: false, trader: null })}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            await updateTraderProfile(payload);
            setProfileDialog({ open: false, trader: null });
            await loadTraders();
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <HistoryDialog
        open={historyDialog.open}
        trader={historyDialog.trader}
        onClose={() => setHistoryDialog({ open: false, trader: null })}
        historyState={historyState}
      />
    </Stack>
  );
};

const Filters = ({ filters, onChange }) => (
  <Card>
    <CardContent>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          label="Search"
          placeholder="Name, UID, phone"
          value={filters.search}
          onChange={(event) => onChange((prev) => ({ ...prev, search: event.target.value }))}
        />
        <TextField
          label="Start Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.startDate}
          onChange={(event) => onChange((prev) => ({ ...prev, startDate: event.target.value }))}
        />
        <TextField
          label="End Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.endDate}
          onChange={(event) => onChange((prev) => ({ ...prev, endDate: event.target.value }))}
        />
      </Stack>
    </CardContent>
  </Card>
);

const SummaryCard = ({ label, value }) => (
  <Card sx={{ flex: 1 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const RegisterDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ userId: "", countryCode: "+1", mobileNumber: "", initialCoins: 0 });

  useEffect(() => {
    if (open) {
      setForm({ userId: "", countryCode: "+1", mobileNumber: "", initialCoins: 0 });
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.userId) {
      alert("User ID is required");
      
return;
    }

    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register Coin Trader</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="User ID" value={form.userId} onChange={handleChange("userId")} helperText="Mongo ID of the user account" />
          <TextField label="Country Code" value={form.countryCode} onChange={handleChange("countryCode")} />
          <TextField label="Mobile Number" value={form.mobileNumber} onChange={handleChange("mobileNumber")} />
          <TextField label="Initial Coins" type="number" value={form.initialCoins} onChange={handleChange("initialCoins")} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Register
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BalanceDialog = ({ open, trader, onClose, onSubmit }) => {
  const [form, setForm] = useState({ type: "credit", amount: 0, note: "" });

  useEffect(() => {
    if (open) {
      setForm({ type: "credit", amount: 0, note: "" });
    }
  }, [open]);

  if (!trader) return null;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Amount must be positive");
      
return;
    }

    await onSubmit({ traderId: trader._id, ...form });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adjust Balance – {trader.user?.displayName || trader._id}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Type" select value={form.type} onChange={handleChange("type")}>
            <MenuItem value="credit">Credit</MenuItem>
            <MenuItem value="debit">Debit</MenuItem>
          </TextField>
          <TextField label="Amount" type="number" value={form.amount} onChange={handleChange("amount")} />
          <TextField label="Note" value={form.note} onChange={handleChange("note")} multiline rows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProfileDialog = ({ open, trader, onClose, onSubmit }) => {
  const [form, setForm] = useState({ countryCode: "", mobileNumber: "" });

  useEffect(() => {
    if (trader) {
      setForm({
        countryCode: trader.countryCode || "",
        mobileNumber: trader.mobileNumber || "",
      });
    }
  }, [trader]);

  if (!trader) return null;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    await onSubmit({ traderId: trader._id, ...form });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Profile – {trader.user?.displayName || trader._id}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Country Code" value={form.countryCode} onChange={handleChange("countryCode")} />
          <TextField label="Mobile Number" value={form.mobileNumber} onChange={handleChange("mobileNumber")} />
        </Stack>
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

const HistoryDialog = ({ open, trader, onClose, historyState }) => {
  if (!trader) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Coin History – {trader.user?.displayName || trader._id}</DialogTitle>
      <DialogContent dividers>
        {historyState.loading ? (
          <Box className="flex justify-center items-center py-10">
            <CircularProgress />
          </Box>
        ) : historyState.error ? (
          <Alert severity="error">{historyState.error}</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyState.entries.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>{entry.isIncome ? "CREDIT" : "DEBIT"}</TableCell>
                  <TableCell>{entry.amount}</TableCell>
                  <TableCell>{entry.note || "—"}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!historyState.entries.length && (
                <TableRow>
                  <TableCell colSpan={4}>No history yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoinTradersPage;
