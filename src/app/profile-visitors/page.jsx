"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from "@mui/material";

import {
  fetchVisitorSummaries,
  fetchVisitorsForProfile,
  fetchVisitedProfiles,
  exportVisitorSummaries,
} from "@/services/v2/profileVisitors";

const ProfileVisitorsPage = () => {
  const [summaries, setSummaries] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailDialog, setDetailDialog] = useState({ open: false, userId: null, tab: "visitors", entries: [], loading: false });
  const [exporting, setExporting] = useState(false);

  const loadSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchVisitorSummaries(filters);

      setSummaries(result.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load visitor summaries");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (userId, tab = "visitors") => {
    setDetailDialog(prev => ({ ...prev, loading: true, tab }));

    try {
      const entries =
        tab === "visitors"
          ? await fetchVisitorsForProfile({ userId, limit: 50 })
          : await fetchVisitedProfiles({ userId, limit: 50 });

      setDetailDialog(prev => ({ ...prev, entries, loading: false }));
    } catch (err) {
      setDetailDialog(prev => ({ ...prev, loading: false }));
      setError(err?.response?.data?.message || err.message || "Unable to load visitor detail");
    }
  };

  const openDetail = async userId => {
    setDetailDialog({ open: true, userId, tab: "visitors", entries: [], loading: true });
    await loadDetail(userId, "visitors");
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportVisitorSummaries(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "profile-visitors.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Profile Visitors</Typography>
        <Typography variant="body2" color="text.secondary">
          Aggregate view of which hosts receive the most visits across the platform.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField
              size="small"
              type="number"
              label="Page"
              value={filters.page}
              onChange={event => setFilters(prev => ({ ...prev, page: Number(event.target.value) || 1 }))}
            />
            <TextField
              size="small"
              type="number"
              label="Limit"
              value={filters.limit}
              onChange={event => setFilters(prev => ({ ...prev, limit: Number(event.target.value) || 25 }))}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={loadSummaries} disabled={loading}>
                Refresh
              </Button>
              <Button variant="text" onClick={handleExport} disabled={exporting}>
                {exporting ? "Exporting…" : "Export CSV"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Profile Owner</TableCell>
              <TableCell>Visits</TableCell>
              <TableCell>Unique Visitors</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Loading visitor data...
                </TableCell>
              </TableRow>
            )}

            {!loading && !summaries.length && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No visitor data available.
                </TableCell>
              </TableRow>
            )}

            {summaries.map(entry => (
              <TableRow key={entry._id}>
                <TableCell>{entry._id}</TableCell>
                <TableCell>{entry.visits}</TableCell>
                <TableCell>{entry.uniqueVisitorCount}</TableCell>
                <TableCell>{entry.lastVisit ? new Date(entry.lastVisit).toLocaleString() : "—"}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openDetail(entry._id)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <VisitorDetailDialog
        open={detailDialog.open}
        userId={detailDialog.userId}
        tab={detailDialog.tab}
        entries={detailDialog.entries}
        loading={detailDialog.loading}
        onClose={() => setDetailDialog({ open: false, userId: null, tab: "visitors", entries: [], loading: false })}
        onTabChange={async nextTab => loadDetail(detailDialog.userId, nextTab)}
      />
    </Stack>
  );
};

const VisitorDetailDialog = ({ open, userId, tab, entries, loading, onClose, onTabChange }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Visitor Details</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, value) => onTabChange(value)} sx={{ mb: 2 }}>
          <Tab label="Visitors" value="visitors" />
          <Tab label="Visited Profiles" value="visited" />
        </Tabs>
        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Visited At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry._id}>
                    <TableCell>{tab === "visitors" ? entry.visitorId : entry.profileOwnerId}</TableCell>
                    <TableCell>{tab === "visitors" ? entry.visitorId?.displayName || "—" : entry.profileOwnerId?.displayName || "—"}</TableCell>
                    <TableCell>{entry.lastVisitedAt ? new Date(entry.lastVisitedAt).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileVisitorsPage;
