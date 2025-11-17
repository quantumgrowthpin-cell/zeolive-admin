"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  CircularProgress,
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

import { listLikeHistory, listLiveHistory } from "@/services/v2/history";

const HistoryPage = () => {
  const [tab, setTab] = useState("likes");
  const [likeState, setLikeState] = useState({ data: [], loading: true, error: null });
  const [liveState, setLiveState] = useState({ data: [], loading: true, error: null, filters: { userId: "" } });

  const loadLikes = async () => {
    setLikeState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await listLikeHistory({ limit: 50 });

      setLikeState({ data: response.data || [], loading: false, error: null });
    } catch (err) {
      setLikeState({ data: [], loading: false, error: err?.response?.data?.message || err.message });
    }
  };

  const loadLive = async () => {
    setLiveState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await listLiveHistory({ limit: 50, userId: liveState.filters.userId || undefined });

      setLiveState((prev) => ({ ...prev, data: response.data || [], loading: false }));
    } catch (err) {
      setLiveState((prev) => ({ ...prev, data: [], loading: false, error: err?.response?.data?.message || err.message }));
    }
  };

  useEffect(() => {
    loadLikes();
  }, []);

  useEffect(() => {
    if (tab === "live") {
      loadLive();
    }
  }, [tab, liveState.filters.userId]);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Engagement History</Typography>
        <Typography variant="body2" color="text.secondary">
          Review recent like activity and host live-session summaries.
        </Typography>
      </div>

      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab label="Like History" value="likes" />
        <Tab label="Live Sessions" value="live" />
      </Tabs>

      {tab === "likes" && <LikeHistoryTable state={likeState} onRefresh={loadLikes} />}
      {tab === "live" && (
        <LiveHistoryTable
          state={liveState}
          onRefresh={loadLive}
          onFilterChange={(userId) => setLiveState((prev) => ({ ...prev, filters: { userId } }))}
        />
      )}
    </Stack>
  );
};

const LikeHistoryTable = ({ state, onRefresh }) => {
  if (state.loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[40dvh]">
        <CircularProgress />
      </Box>
    );
  }

  if (state.error) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{state.error}</Typography>
        <Button variant="outlined" onClick={onRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Target</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.data.map((entry) => (
            <TableRow key={entry._id}>
              <TableCell>{entry.userId?.displayName || entry.userId?._id}</TableCell>
              <TableCell>{entry.targetOwnerId?.displayName || entry.targetOwnerId?._id}</TableCell>
              <TableCell>{entry.postId ? `Post ${entry.postId}` : entry.videoId ? `Video ${entry.videoId}` : "—"}</TableCell>
              <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {!state.data.length && (
            <TableRow>
              <TableCell colSpan={4}>No like history found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const LiveHistoryTable = ({ state, onRefresh, onFilterChange }) => {
  if (state.loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[40dvh]">
        <CircularProgress />
      </Box>
    );
  }

  if (state.error) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{state.error}</Typography>
        <Button variant="outlined" onClick={onRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
        <TextField
          size="small"
          label="Filter by User ID"
          value={state.filters.userId}
          onChange={(event) => onFilterChange(event.target.value)}
        />
        <Button onClick={onRefresh}>Refresh</Button>
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Host</TableCell>
              <TableCell>Session</TableCell>
              <TableCell>Earned Coins</TableCell>
              <TableCell>Viewers</TableCell>
              <TableCell>Duration (s)</TableCell>
              <TableCell>Start</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.data.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{entry.userId?.displayName || entry.userId?._id}</TableCell>
                <TableCell>{entry.sessionId}</TableCell>
                <TableCell>{entry.earnedCoins}</TableCell>
                <TableCell>{entry.viewerCount}</TableCell>
                <TableCell>{entry.durationSeconds}</TableCell>
                <TableCell>{new Date(entry.startedAt || entry.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!state.data.length && (
              <TableRow>
                <TableCell colSpan={6}>No live history found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default HistoryPage;
