"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
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
import { CheckCircle, HighlightOff } from "@mui/icons-material";

import { fetchHostApplications, updateHostApplicationStatus } from "@/services/v2/hostApplications";

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const HostApplicationsPage = () => {
  const [status, setStatus] = useState("PENDING");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadApplications = async (selectedStatus = status) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchHostApplications({ status: selectedStatus !== "ALL" ? selectedStatus : undefined });

      setApplications(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications(status);
  }, [status]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleAction = async (applicationId, nextStatus) => {
    setActionLoading(applicationId);
    setResult(null);

    try {
      await updateHostApplicationStatus({ applicationId, status: nextStatus });
      setResult({ type: "success", message: `Application ${nextStatus.toLowerCase()}` });
      await loadApplications(status);
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to update application" });
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
        <Button variant="contained" onClick={() => loadApplications(status)}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Host Applications</Typography>
          <Typography variant="body2" color="text.secondary">
            Review agency/BDM onboarding requests submitted from the mobile app.
          </Typography>
        </div>
        <TextField select size="small" label="Status" value={status} onChange={handleStatusChange}>
          {statusOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Applicant</TableCell>
              <TableCell>Introduction</TableCell>
              <TableCell>Agency</TableCell>
              <TableCell>BD Manager</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={application.userId?.avatarUrl}>
                      {application.userId?.displayName?.[0] || "H"}
                    </Avatar>
                    <div>
                      <Typography fontWeight={600}>{application.userId?.displayName || application.userId?._id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{application._id.slice(-6)}
                      </Typography>
                    </div>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 320 }}>
                    {application.introduction || "—"}
                  </Typography>
                </TableCell>
                <TableCell>{application.agencyId || "—"}</TableCell>
                <TableCell>{application.bdManagerId || "—"}</TableCell>
                <TableCell>
                  {new Date(application.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      color="success"
                      onClick={() => handleAction(application._id, "APPROVED")}
                      disabled={actionLoading === application._id}
                    >
                      <CheckCircle />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleAction(application._id, "REJECTED")}
                      disabled={actionLoading === application._id}
                    >
                      <HighlightOff />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default HostApplicationsPage;
