"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
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
import { Add, Delete, Edit } from "@mui/icons-material";

import {
  listReferralSystems,
  createReferralSystem,
  updateReferralSystem,
  toggleReferralSystem,
  deleteReferralSystem,
} from "@/services/v2/referralSystems";

const defaultForm = {
  targetReferrals: "",
  rewardCoins: "",
  isActive: true,
};

const ReferralsPage = () => {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, record: null });
  const [actionLoading, setActionLoading] = useState(null);

  const loadSystems = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listReferralSystems();
      setSystems(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load referral systems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystems();
  }, []);

  const metrics = useMemo(() => {
    const totalActive = systems.filter((row) => row.isActive).length;
    const totalReward = systems.reduce((sum, row) => sum + Number(row.rewardCoins || 0), 0);
    return { total: systems.length, active: totalActive, reward: totalReward };
  }, [systems]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this referral system?")) return;
    setActionLoading(id);
    try {
      await deleteReferralSystem(id);
      await loadSystems();
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (id) => {
    setActionLoading(id);
    try {
      await toggleReferralSystem(id);
      await loadSystems();
    } finally {
      setActionLoading(null);
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
        <Button variant="contained" onClick={loadSystems}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }}>
        <div>
          <Typography variant="h5">Referral Systems</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure referral milestones that award coins when agencies or hosts recruit new talent.
          </Typography>
        </div>
        <Button startIcon={<Add />} variant="contained" onClick={() => setDialog({ open: true, record: null })}>
          New Referral Tier
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Total Tiers" value={metrics.total} />
        <SummaryCard label="Active Tiers" value={metrics.active} />
        <SummaryCard label="Total Reward Coins" value={metrics.reward.toLocaleString()} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Target Referrals</TableCell>
              <TableCell>Reward Coins</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {systems.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.targetReferrals}</TableCell>
                <TableCell>{row.rewardCoins}</TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>{formatDate(row.updatedAt)}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.isActive ? "Active" : "Inactive"} color={row.isActive ? "success" : "default"} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => handleToggle(row._id)} disabled={actionLoading === row._id}>
                      {row.isActive ? "Disable" : "Enable"}
                    </Button>
                    <IconButton size="small" onClick={() => setDialog({ open: true, record: row })}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(row._id)}
                      disabled={actionLoading === row._id}
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!systems.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No referral tiers configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ReferralDialog
        open={dialog.open}
        record={dialog.record}
        onClose={() => setDialog({ open: false, record: null })}
        onSubmit={async (values) => {
          if (dialog.record) {
            await updateReferralSystem(dialog.record._id, values);
          } else {
            await createReferralSystem(values);
          }
          setDialog({ open: false, record: null });
          await loadSystems();
        }}
      />
    </Stack>
  );
};

const ReferralDialog = ({ open, record, onClose, onSubmit }) => {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        targetReferrals: record.targetReferrals?.toString() || "",
        rewardCoins: record.rewardCoins?.toString() || "",
        isActive: record.isActive ?? true,
      });
    } else {
      setForm(defaultForm);
    }
  }, [record]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "isActive") {
      setForm((prev) => ({ ...prev, isActive: value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const target = Number(form.targetReferrals);
    const reward = Number(form.rewardCoins);
    if (!target || target < 1) {
      alert("Target referrals must be a positive number");
      return;
    }
    if (!reward || reward < 1) {
      alert("Reward coins must be a positive number");
      return;
    }
    setSubmitting(true);

    try {
      await onSubmit({
        targetReferrals: target,
        rewardCoins: reward,
        isActive: form.isActive,
      });
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Unable to save referral system");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{record ? "Edit Referral Tier" : "New Referral Tier"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Target Referrals"
          name="targetReferrals"
          type="number"
          value={form.targetReferrals}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Reward Coins"
          name="rewardCoins"
          type="number"
          value={form.rewardCoins}
          onChange={handleChange}
          fullWidth
        />
        <TextField select label="Status" name="isActive" value={form.isActive ? "true" : "false"} onChange={handleChange}>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SummaryCard = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 180 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value ?? "--"}</Typography>
  </Box>
);

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export default ReferralsPage;
