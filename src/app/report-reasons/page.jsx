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
  listReportReasons,
  createReportReason,
  updateReportReason,
  deleteReportReason,
} from "@/services/v2/reportReasons";

const ReportReasonsPage = () => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogState, setDialogState] = useState({ open: false, reason: null });
  const [submitting, setSubmitting] = useState(false);

  const loadReasons = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listReportReasons();

      setReasons(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load report reasons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, []);

  const handleDelete = async (reasonId) => {
    if (!window.confirm("Delete this reason?")) return;
    setSubmitting(true);

    try {
      await deleteReportReason(reasonId);
      await loadReasons();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (reason) => {
    setSubmitting(true);

    try {
      await updateReportReason(reason._id, { isActive: !reason.isActive });
      await loadReasons();
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
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
        <div>
          <Typography variant="h5">Report Reasons</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure the list of reasons users can select when filing abuse reports.
          </Typography>
        </div>
        <Button startIcon={<Add />} variant="contained" onClick={() => setDialogState({ open: true, reason: null })}>
          Add Reason
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
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reasons.map((reason) => (
              <TableRow key={reason._id} hover>
                <TableCell>{reason.title}</TableCell>
                <TableCell>{reason.description || "—"}</TableCell>
                <TableCell>
                  <Switch checked={reason.isActive} onChange={() => toggleActive(reason)} disabled={submitting} />
                </TableCell>
                <TableCell>
                  {new Date(reason.updatedAt || reason.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => setDialogState({ open: true, reason })}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(reason._id)} disabled={submitting}>
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!reasons.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2">No report reasons yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ReasonDialog
        open={dialogState.open}
        reason={dialogState.reason}
        onClose={() => setDialogState({ open: false, reason: null })}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            if (dialogState.reason) {
              await updateReportReason(dialogState.reason._id, payload);
            } else {
              await createReportReason(payload);
            }

            setDialogState({ open: false, reason: null });
            await loadReasons();
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Stack>
  );
};

const ReasonDialog = ({ open, onClose, reason, onSubmit }) => {
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    if (reason) {
      setForm({ title: reason.title || "", description: reason.description || "" });
    } else {
      setForm({ title: "", description: "" });
    }
  }, [reason]);

  const handleChange = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert("Title is required");
      
return;
    }

    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{reason ? "Edit Reason" : "Add Reason"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Title" value={form.title} onChange={handleChange("title")} />
          <TextField label="Description" multiline rows={3} value={form.description} onChange={handleChange("description")} />
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

export default ReportReasonsPage;
