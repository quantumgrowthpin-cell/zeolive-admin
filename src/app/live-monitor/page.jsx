"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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

import { fetchLiveStats } from "@/services/v2/live";

const LiveMonitorPage = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ range: "7" });

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - Number(filters.range) * 24 * 60 * 60 * 1000).toISOString();
      const data = await fetchLiveStats({ startDate, endDate });

      setStats(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch live stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [filters]);

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
        <Button variant="contained" onClick={loadStats}>
          Retry
        </Button>
      </Stack>
    );
  }

  const totals = stats.reduce(
    (acc, entry) => {
      acc.sessions += entry.sessions;
      acc.duration += entry.avgDurationSeconds;
      
return acc;
    },
    { sessions: 0, duration: 0 }
  );

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Live Monitoring</Typography>
          <Typography variant="body2" color="text.secondary">
            Track live/audio/PK sessions across the platform.
          </Typography>
        </div>
        <TextField
          select
          label="Range (days)"
          size="small"
          value={filters.range}
          onChange={(event) => setFilters((prev) => ({ ...prev, range: event.target.value }))}
        >
          {["1", "3", "7", "14", "30"].map((day) => (
            <MenuItem key={day} value={day}>
              {day} days
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Sessions
            </Typography>
            <Typography variant="h6">{totals.sessions}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Avg Duration (sec)
            </Typography>
            <Typography variant="h6">{Math.round(totals.duration / (stats.length || 1))}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Sessions</TableCell>
              <TableCell>Avg Duration (sec)</TableCell>
              <TableCell>Avg Peak Viewers</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((entry) => (
              <TableRow key={entry.liveType}>
                <TableCell>{entry.liveType}</TableCell>
                <TableCell>{entry.sessions}</TableCell>
                <TableCell>{entry.avgDurationSeconds}</TableCell>
                <TableCell>{entry.avgPeakViewers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default LiveMonitorPage;
