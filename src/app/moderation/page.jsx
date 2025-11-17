"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { CheckCircle, HighlightOff, Gavel } from "@mui/icons-material";

import { fetchReports, updateReportStatus, updateUserStatus } from "@/services/v2/moderation";
import ModerationAlertsPanel from "@/components/moderation/ModerationAlertsPanel";

const statusOptions = ["ALL", "OPEN", "RESOLVED", "DISMISSED"];

const ModerationPage = () => {
  const [status, setStatus] = useState("OPEN");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadReports = async (selectedStatus = status) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchReports({ status: selectedStatus !== "ALL" ? selectedStatus : undefined });

      setReports(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(status);
  }, [status]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleReportAction = async (reportId, nextStatus) => {
    setActionLoading(reportId);

    try {
      await updateReportStatus({ reportId, status: nextStatus });
      await loadReports(status);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm("Ban this user?")) return;
    setActionLoading(userId);

    try {
      await updateUserStatus({ userId, status: "BANNED" });
      alert("User banned successfully");
    } finally {
      setActionLoading(null);
    }
  };

  const summary = useMemo(() => {
    return reports.reduce(
      (acc, report) => {
        acc.total += 1;
        acc.byStatus[report.status] = (acc.byStatus[report.status] || 0) + 1;
        
return acc;
      },
      { total: 0, byStatus: {} }
    );
  }, [reports]);

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
        <Button variant="contained" onClick={() => loadReports(status)}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Moderation Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Review user-generated reports and action accounts when necessary.
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <TextField select size="small" label="Status" value={status} onChange={handleStatusChange}>
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Button onClick={() => loadReports(status)}>Refresh</Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <SummaryCard label="Reports" value={summary.total} />
        {Object.entries(summary.byStatus).map(([state, count]) => (
          <SummaryCard key={state} label={state} value={count} />
        ))}
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reporter</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id} hover>
                <TableCell>{report.reporterId || "—"}</TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography>{report.targetUserId || "—"}</Typography>
                    <Button size="small" variant="text" color="error" onClick={() => handleBanUser(report.targetUserId)} disabled={actionLoading === report.targetUserId}>
                      Ban User
                    </Button>
                  </Stack>
                </TableCell>
                <TableCell>{report.reason || "—"}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 320 }}>
                    {report.description || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={report.status} color={chipColorForStatus(report.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(report.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      onClick={() => handleReportAction(report._id, "RESOLVED")}
                      disabled={actionLoading === report._id}
                    >
                      <CheckCircle fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleReportAction(report._id, "DISMISSED")}
                      disabled={actionLoading === report._id}
                    >
                      <HighlightOff fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ModerationAlertsPanel />
    </Stack>
  );
};

const SummaryCard = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 160 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value ?? "--"}</Typography>
  </Box>
);

const chipColorForStatus = (status) => {
  switch (status) {
    case "RESOLVED":
      return "success";
    case "DISMISSED":
      return "default";
    default:
      return "warning";
  }
};

export default ModerationPage;
