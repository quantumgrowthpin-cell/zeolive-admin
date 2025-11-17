"use client";

import { useEffect, useState } from "react";

import {
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";

import {
  listAgencyCommissions,
  createAgencyCommission,
  updateAgencyCommission,
  deleteAgencyCommission,
} from "@/services/v2/agencyCommission";

const AgencyCommissionPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogState, setDialogState] = useState({ open: false, entry: null });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listAgencyCommissions();

      setEntries(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load agency commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    setSubmitting(true);

    try {
      await deleteAgencyCommission(id);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (entry) => {
    setSubmitting(true);

    try {
      await updateAgencyCommission(entry._id, { isActive: !entry.isActive });
      await loadData();
    } finally {
      setSubmitting(false);
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
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Agency Commission</Typography>
          <Typography variant="body2" color="text.secondary">
            Maintain earnings thresholds and commission rates for payout calculations.
          </Typography>
        </div>
        <Button startIcon={<Add />} variant="contained" onClick={() => setDialogState({ open: true, entry: null })}>
          Add Entry
        </Button>
      </Stack>

      {error && (
        <Card>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Total Earnings ≥</TableCell>
              <TableCell>Commission Rate (%)</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id} hover>
                <TableCell>{entry.totalEarnings}</TableCell>
                <TableCell>{entry.commissionRate}</TableCell>
                <TableCell>{entry.notes || "—"}</TableCell>
                <TableCell>
                  <Switch checked={entry.isActive} onChange={() => toggleActive(entry)} disabled={submitting} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => setDialogState({ open: true, entry })}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(entry._id)} disabled={submitting}>
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!entries.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2">No commissions configured.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CommissionDialog
        open={dialogState.open}
        entry={dialogState.entry}
        onClose={() => setDialogState({ open: false, entry: null })}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            if (dialogState.entry) {
              await updateAgencyCommission(dialogState.entry._id, payload);
            } else {
              await createAgencyCommission(payload);
            }

            setDialogState({ open: false, entry: null });
            await loadData();
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Stack>
  );
};

const CommissionDialog = ({ open, onClose, entry, onSubmit }) => {
  const [form, setForm] = useState({ totalEarnings: 0, commissionRate: 0, notes: "" });

  useEffect(() => {
    if (entry) {
      setForm({
        totalEarnings: entry.totalEarnings,
        commissionRate: entry.commissionRate,
        notes: entry.notes || "",
      });
    } else {
      setForm({ totalEarnings: 0, commissionRate: 0, notes: "" });
    }
  }, [entry]);

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = () => {
    if (!Number(form.totalEarnings) && Number(form.totalEarnings) !== 0) {
      alert("Total earnings must be numeric");
      
return;
    }

    onSubmit({
      totalEarnings: Number(form.totalEarnings),
      commissionRate: Number(form.commissionRate),
      notes: form.notes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{entry ? "Edit Commission" : "Add Commission"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Total Earnings ≥" type="number" value={form.totalEarnings} onChange={handleChange("totalEarnings")} />
          <TextField label="Commission Rate (%)" type="number" value={form.commissionRate} onChange={handleChange("commissionRate")} />
          <TextField label="Notes" multiline rows={3} value={form.notes} onChange={handleChange("notes")} />
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

export default AgencyCommissionPage;
