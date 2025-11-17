"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { fetchAuditLogs } from "@/services/v2/audit";

const ACTION = "MODERATION_BLOCKED";
const resourceFilters = [
  { value: "ALL", label: "All contexts" },
  { value: "post", label: "Posts" },
  { value: "chat", label: "Chat" },
  { value: "fake-live-thumbnail", label: "Fake Live Thumbnails" },
  { value: "fake-live-stream", label: "Fake Live Streams" },
];

const formatContextLabel = (context) => {
  if (!context) return "—";
  const mapping = {
    post: "Community post",
    chat: "Chat attachment",
    "fake-live-thumbnail": "Fake live thumbnail",
    "fake-live-stream": "Fake live stream",
    video: "Video",
  };
  return mapping[context] || context;
};

const ModerationAlertsPanel = ({ limit = 5, showHeaderActions = true }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchAuditLogs({
        page: 1,
        limit,
        action: ACTION,
        resourceType: resourceFilter === "ALL" ? undefined : resourceFilter,
      });
      setLogs(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load automatic moderation alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [resourceFilter]);

  const handleCopy = (value, id) => {
    if (!value || !navigator?.clipboard) return;
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const hasMoreThanLimit = useMemo(() => (logs?.length || 0) >= limit, [logs?.length, limit]);

  return (
    <Card>
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Typography variant="h6">Automatic Moderation Alerts</Typography>
          {showHeaderActions && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Select size="small" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}>
                {resourceFilters.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
              <Button variant="outlined" onClick={loadAlerts} disabled={loading}>
                Refresh
              </Button>
              {hasMoreThanLimit && (
                <Button component={Link} href="/moderation/alerts" variant="text">
                  View all
                </Button>
              )}
            </Stack>
          )}
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box className="flex justify-center items-center min-bs-[20dvh]">
            <CircularProgress size={24} />
          </Box>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Time</TableCell>
                  <TableCell>Context</TableCell>
                  <TableCell>Triggered By</TableCell>
                  <TableCell>Reasons</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={formatContextLabel(log.resourceType)} color="info" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>
                          {log.actorId?.displayName || log.actorId?.email || log.actorId?._id || "System"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.actorId?.email || (log.actorId?._id ? `User ID: ${log.actorId._id}` : "—")}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(log.details?.reasons || []).map((reason) => (
                          <Chip key={`${log._id}-${reason}`} label={reason} size="small" color="error" variant="outlined" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {log.resourceId && (
                          <Tooltip title={copiedId === log._id ? "Copied!" : "Copy resource ID"}>
                            <IconButton size="small" onClick={() => handleCopy(log.resourceId, log._id)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {log.resourceId && /^https?:/i.test(log.resourceId) && (
                          <Tooltip title="Open asset">
                            <IconButton size="small" href={log.resourceId} target="_blank" rel="noreferrer">
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {log.actorId?._id && (
                          <Button
                            size="small"
                            component={Link}
                            href={`/users?focus=${log.actorId._id}`}
                            variant="text"
                          >
                            Inspect user
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!logs.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No automated blocks yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ModerationAlertsPanel;
