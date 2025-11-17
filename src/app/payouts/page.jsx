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
import { CheckCircle, HighlightOff, Paid, Refresh, Download } from "@mui/icons-material";

import { fetchPayoutRequests, updatePayoutStatus } from "@/services/v2/payouts";

const statusOptions = ["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"];

const actionStatuses = [
  { value: "APPROVED", label: "Approve", icon: <CheckCircle fontSize="inherit" /> },
  { value: "PAID", label: "Mark Paid", icon: <Paid fontSize="inherit" /> },
  { value: "REJECTED", label: "Reject", icon: <HighlightOff fontSize="inherit" /> },
];

const NotesDialog = ({ open, onClose, onSubmit, status }) => {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);

    try {
      await onSubmit(notes);
      setNotes("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{`Add notes for ${status}`}</DialogTitle>
      <DialogContent>
        <TextField
          label="Notes (optional)"
          multiline
          minRows={3}
          fullWidth
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PayoutsPage = () => {
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [notesDialog, setNotesDialog] = useState({ open: false, requestId: null, status: null });

  const loadPayouts = async (selectedStatus = status) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPayoutRequests({ status: selectedStatus !== "ALL" ? selectedStatus : undefined });

      setRows(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts(status);
  }, [status]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleAction = (requestId, nextStatus) => {
    setNotesDialog({ open: true, requestId, status: nextStatus });
  };

  const submitStatus = async (notes) => {
    const { requestId, status: nextStatus } = notesDialog;

    if (!requestId || !nextStatus) return;
    setActionLoading(requestId);

    try {
      await updatePayoutStatus({ requestId, status: nextStatus, notes });
      await loadPayouts(status);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await fetchPayoutRequests({
        status: status !== "ALL" ? status : undefined,
        format: "csv",
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `payouts_${status.toLowerCase() || "all"}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV.");
    }
  };

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, request) => {
          acc.amount += Number(request.amount || 0);
          acc.count += 1;
          
return acc;
        },
        { amount: 0, count: 0 }
      ),
    [rows]
  );

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
        <Button variant="contained" onClick={() => loadPayouts(status)}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} alignItems="center">
        <div>
          <Typography variant="h5">Payout Requests</Typography>
          <Typography variant="body2" color="text.secondary">
            Review withdrawal requests submitted by hosts and agencies.
          </Typography>
        </div>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField select label="Status" value={status} onChange={handleStatusChange} size="small">
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Button startIcon={<Download />} variant="outlined" onClick={handleExport}>
            Export CSV
          </Button>
          <IconButton onClick={() => loadPayouts(status)}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryTile label="Requests" value={totals.count} />
        <SummaryTile label="Total Amount" value={totals.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Request</TableCell>
              <TableCell>User</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Account</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((request) => (
              <TableRow key={request._id} hover>
                <TableCell>
                  <Typography variant="body2">#{request._id?.slice(-8)}</Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{request.ownerId || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Wallet: {request.walletId || "—"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {request.amount?.toLocaleString?.("en-US", { style: "currency", currency: request.currency || "USD" }) ||
                    request.amount}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {request.payoutAccountId || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={request.status} color={chipColorForStatus(request.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(request.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {actionStatuses.map((action) => (
                      <Tooltip title={action.label} key={action.value}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleAction(request._id, action.value)}
                            disabled={actionLoading === request._id || request.status === action.value}
                          >
                            {action.icon}
                          </IconButton>
                        </span>
                      </Tooltip>
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <NotesDialog
        open={notesDialog.open}
        status={notesDialog.status}
        onClose={() => setNotesDialog({ open: false, requestId: null, status: null })}
        onSubmit={submitStatus}
      />
    </Stack>
  );
};

const SummaryTile = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 180 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value ?? "--"}</Typography>
  </Box>
);

const chipColorForStatus = (status) => {
  switch (status) {
    case "APPROVED":
      return "warning";
    case "PAID":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
};

export default PayoutsPage;
