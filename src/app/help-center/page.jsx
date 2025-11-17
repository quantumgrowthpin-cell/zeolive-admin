"use client";

import { useEffect, useState } from "react";

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
import { CheckCircle, Pending } from "@mui/icons-material";

import { fetchTickets, updateTicketStatus, fetchFaq, createFaq } from "@/services/v2/help";

const FaqDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({ question: "", answer: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      await onSubmit(form);
      setForm({ question: "", answer: "" });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create FAQ</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField label="Question" name="question" value={form.question} onChange={handleChange} />
        <TextField
          label="Answer"
          name="answer"
          value={form.answer}
          onChange={handleChange}
          multiline
          minRows={3}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HelpCenterPage = () => {
  const [tickets, setTickets] = useState([]);
  const [faq, setFaq] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [result, setResult] = useState(null);

  const loadHelpData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ticketData, faqData] = await Promise.all([fetchTickets(), fetchFaq()]);

      setTickets(ticketData);
      setFaq(faqData);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load help center data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHelpData();
  }, []);

  const handleTicketUpdate = async (ticketId, status) => {
    setResult(null);

    try {
      await updateTicketStatus({ ticketId, status });
      setResult({ type: "success", message: "Ticket updated" });
      await loadHelpData();
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to update ticket" });
    }
  };

  const handleCreateFaq = async (payload) => {
    await createFaq(payload);
    await loadHelpData();
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
        <Button variant="contained" onClick={loadHelpData}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h5">Help Center</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage support tickets and FAQs for ChimaX users.
        </Typography>
      </div>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
            <Typography variant="h6">FAQs</Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              Add FAQ
            </Button>
          </Stack>
          <Stack spacing={2} sx={{ mt: 3 }}>
            {faq.map((entry) => (
              <Box key={entry._id} sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                <Typography fontWeight={600}>{entry.question}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {entry.answer}
                </Typography>
              </Box>
            ))}
            {!faq.length && <Typography variant="body2">No FAQs yet.</Typography>}
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ticket</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{ticket.subject}</Typography>
                  <Typography variant="body2">{ticket.message}</Typography>
                </TableCell>
                <TableCell>{ticket.userId}</TableCell>
                <TableCell>
                  <Alert icon={false} severity={ticket.status === "CLOSED" ? "success" : "info"}>
                    {ticket.status}
                  </Alert>
                </TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton color="success" onClick={() => handleTicketUpdate(ticket._id, "CLOSED")}>
                      <CheckCircle />
                    </IconButton>
                    <IconButton color="warning" onClick={() => handleTicketUpdate(ticket._id, "OPEN")}>
                      <Pending />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <FaqDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreateFaq} />
    </Stack>
  );
};

export default HelpCenterPage;
