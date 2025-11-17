"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { Download } from "lucide-react";

import { fetchFollowers, fetchFollowing, fetchSocialSummary, exportFollowerCsv, exportCohortCsv } from "@/services/v2/socialGraph";

const SocialGraphPage = () => {
  const [activeTab, setActiveTab] = useState("followers");
  const [filters, setFilters] = useState({ userId: "", limit: 25 });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryWindow, setSummaryWindow] = useState(30);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [cohortExporting, setCohortExporting] = useState(false);

  const handleExport = async () => {
    try {
      setCsvExporting(true);
      const blob = await exportFollowerCsv({});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "followers.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvExporting(false);
    }
  };

  const handleCohortExport = async () => {
    try {
      setCohortExporting(true);
      const blob = await exportCohortCsv({ days: summaryWindow });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "follower-cohorts.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setCohortExporting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "followers") {
        const list = await fetchFollowers({ userId: filters.userId || undefined, limit: filters.limit });

        setFollowers(list);
      } else {
        const list = await fetchFollowing({ userId: filters.userId || undefined, limit: filters.limit });

        setFollowing(list);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load graph data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    setSummaryLoading(true);
    setSummaryError(null);
    fetchSocialSummary({ days: summaryWindow })
      .then(data => setSummary(data))
      .catch(err => setSummaryError(err?.response?.data?.message || err.message || "Unable to load summary"))
      .finally(() => setSummaryLoading(false));
  }, [summaryWindow]);

  const cohortCards = useMemo(() => summary?.cohorts || [], [summary]);
  const geoBreakdown = useMemo(() => summary?.geoBreakdown || [], [summary]);

  const formatRole = role => {
    if (!role) return "User";
    
return role
      .toLowerCase()
      .split("_")
      .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Follower Graph</Typography>
        <Typography variant="body2" color="text.secondary">
          Inspect who follows a given user and who they follow back.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField
              size="small"
              label="User ID"
              value={filters.userId}
              onChange={event => setFilters(prev => ({ ...prev, userId: event.target.value }))}
            />
            <TextField
              size="small"
              type="number"
              label="Limit"
              value={filters.limit}
              onChange={event => setFilters(prev => ({ ...prev, limit: Number(event.target.value) || 25 }))}
            />
            <Button variant="contained" onClick={loadData} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {summaryError && <Alert severity="warning">{summaryError}</Alert>}

      {summary && (
        <Stack spacing={2} sx={{ mb: 1 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Total Links
                </Typography>
                <Typography variant="h5">{summary.totals?.totalRelations?.toLocaleString() || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  +{summary.totals?.newRelations?.toLocaleString() || 0} in last {summary.totals?.daysWindow || 30} days
                </Typography>
              </CardContent>
            </Card>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField
                size="small"
                type="number"
                label="Days Window"
                value={summaryWindow}
                onChange={event => setSummaryWindow(Math.max(1, Number(event.target.value) || 1))}
                sx={{ maxWidth: 140 }}
              />
              <Button variant="outlined" onClick={handleExport} startIcon={<Download size={16} />} disabled={csvExporting}>
                {csvExporting ? "Exporting…" : "Export Follows"}
              </Button>
            </Stack>
          </Stack>

          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">Role cohorts</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Distribution of new followers by their primary role in the last {summary.totals?.daysWindow || 30} days.
                  </Typography>
                </Box>
                <Button variant="text" size="small" onClick={handleCohortExport} startIcon={<Download size={16} />} disabled={cohortExporting}>
                  {cohortExporting ? "Exporting…" : "Export Cohorts"}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {summaryLoading ? (
                <LinearProgress />
              ) : cohortCards.length ? (
                <Stack spacing={1.5}>
                  {cohortCards.map(item => (
                    <Box key={item.role}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {formatRole(item.role)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.follows?.toLocaleString() || 0} follows · {item.uniqueProfiles?.toLocaleString() || 0} profiles
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={item.share || 0} sx={{ height: 6, borderRadius: 999 }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not enough cohort data available for the selected window.
                </Typography>
              )}
            </CardContent>
          </Card>

          {!!geoBreakdown.length && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Top regions
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {geoBreakdown.map(entry => (
                    <Chip key={entry._id || "unknown"} label={`${entry._id || "Unknown"} · ${entry.follows}`} size="small" color="info" variant="outlined" />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {summary?.timeline?.length ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Follows per Day (last {summary.totals?.daysWindow || 30} days)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>New Links</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.timeline.map(entry => (
                  <TableRow key={entry._id}>
                    <TableCell>{entry._id}</TableCell>
                    <TableCell>{entry.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
        <Tab label="Followers" value="followers" />
        <Tab label="Following" value="following" />
      </Tabs>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Other Party</TableCell>
              <TableCell>Followed At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && activeTab === "followers" && !followers.length && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No followers found.
                </TableCell>
              </TableRow>
            )}
            {!loading && activeTab === "following" && !following.length && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Not following anyone.
                </TableCell>
              </TableRow>
            )}

            {activeTab === "followers" &&
              followers.map(entry => (
                <TableRow key={entry._id}>
                  <TableCell>{entry.followeeId}</TableCell>
                  <TableCell>{entry.followerId}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}

            {activeTab === "following" &&
              following.map(entry => (
                <TableRow key={entry._id}>
                  <TableCell>{entry.followerId}</TableCell>
                  <TableCell>{entry.followeeId}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default SocialGraphPage;
