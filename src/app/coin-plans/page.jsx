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
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete, Edit, Bolt, Star, StarBorder } from "@mui/icons-material";

import {
  listCoinPlans,
  createCoinPlan,
  updateCoinPlan,
  toggleCoinPlan,
  deleteCoinPlan,
} from "@/services/v2/coinPlans";

const defaultForm = {
  coin: "",
  amount: "",
  productKey: "",
};

const CoinPlanDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(initialData || defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        coin: initialData.coin ?? "",
        amount: initialData.amount ?? "",
        productKey: initialData.productKey || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? "Edit Coin Plan" : "Create Coin Plan"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Coins"
          name="coin"
          type="number"
          value={form.coin}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Amount"
          name="amount"
          type="number"
          value={form.amount}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Product Key"
          name="productKey"
          value={form.productKey}
          onChange={handleChange}
          helperText="Used for IAP mapping (optional)"
        />
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

const CoinPlansPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listCoinPlans();

      setRows(data);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load coin plans";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleSave = async (formValues) => {
    if (editingPlan) {
      await updateCoinPlan(editingPlan._id, formValues);
    } else {
      await createCoinPlan(formValues);
    }

    await loadPlans();
  };

  const handleToggle = async (plan, field) => {
    setActionLoading(plan._id + field);

    try {
      await toggleCoinPlan(plan._id, field);
      await loadPlans();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm("Delete this coin plan?")) return;
    setActionLoading(planId);

    try {
      await deleteCoinPlan(planId);
      await loadPlans();
    } finally {
      setActionLoading(null);
    }
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, plan) => {
        acc.coins += Number(plan.coin || 0);
        acc.amount += Number(plan.amount || 0);
        
return acc;
      },
      { coins: 0, amount: 0 }
    );
  }, [rows]);

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
        <Button variant="contained" onClick={loadPlans}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
        <div>
          <Typography variant="h5">Coin Plans</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage in-app top-up packages served by backend-v2.
          </Typography>
        </div>
        <Button variant="contained" onClick={handleCreate}>
          Create Coin Plan
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <PaperStat label="Plans" value={rows.length} />
        <PaperStat label="Total Coins" value={totals.coins} />
        <PaperStat label="Total Amount" value={totals.amount} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="right">Coins</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Product Key</TableCell>
              <TableCell>Popular</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((plan) => (
              <TableRow key={plan._id} hover>
                <TableCell align="right">{plan.coin?.toLocaleString?.() ?? plan.coin}</TableCell>
                <TableCell align="right">{plan.amount}</TableCell>
                <TableCell>
                  <Typography variant="caption">{plan.productKey || "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={plan.isPopular ? "Popular" : "Normal"} color={plan.isPopular ? "warning" : "default"} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={plan.isActive ? "Active" : "Disabled"}
                    color={plan.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title={plan.isActive ? "Disable" : "Enable"}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleToggle(plan, "isActive")}
                          disabled={actionLoading === plan._id + "isActive"}
                        >
                          <Bolt fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Toggle Popular">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleToggle(plan, "isPopular")}
                          disabled={actionLoading === plan._id + "isPopular"}
                        >
                          {plan.isPopular ? <Star fontSize="inherit" /> : <StarBorder fontSize="inherit" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleEdit(plan)}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(plan._id)}
                      disabled={actionLoading === plan._id}
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CoinPlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        initialData={editingPlan}
      />
    </Stack>
  );
};

const PaperStat = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 180 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value?.toLocaleString?.() ?? value ?? "--"}</Typography>
  </Box>
);

export default CoinPlansPage;
