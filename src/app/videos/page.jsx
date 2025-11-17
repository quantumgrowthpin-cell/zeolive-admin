"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Chip,
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

import { listVideos, updateVideo } from "@/services/v2/videos";

const statusFilters = ["ALL", "ACTIVE", "HIDDEN", "REMOVED"];

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [meta, setMeta] = useState({});
  const [filters, setFilters] = useState({ status: "ALL", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listVideos({
        status: filters.status !== "ALL" ? filters.status : undefined,
        search: filters.search || undefined,
        limit: 30,
      });

      setVideos(response.data || []);
      setMeta(response.meta || {});
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [filters]);

  const handleUpdate = async (videoId, payload) => {
    setActionLoading(videoId);

    try {
      await updateVideo(videoId, payload);
      await loadVideos();
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

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Video Moderation</Typography>
          <Typography variant="body2" color="text.secondary">
            Review uploaded clips and hide or remove abusive content.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            size="small"
            placeholder="Search caption, ID, or user"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusFilters.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Button onClick={loadVideos}>Refresh</Button>
        </Stack>
      </Stack>

      {error && (
        <Typography color="error">{error}</Typography>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Video</TableCell>
              <TableCell>Caption</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video._id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{video.userId?.displayName || video.userId?.email || video.userId?._id || "Unknown"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {video.uniqueVideoId}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {video.caption || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={video.status} color={chipColor(video.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {video.isFake && <Chip label="Fake" color="warning" size="small" />}
                  </Stack>
                </TableCell>
                <TableCell>
                  {new Date(video.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      onClick={() => handleUpdate(video._id, { status: "ACTIVE" })}
                      disabled={actionLoading === video._id || video.status === "ACTIVE"}
                    >
                      Activate
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleUpdate(video._id, { status: "HIDDEN" })}
                      disabled={actionLoading === video._id || video.status === "HIDDEN"}
                    >
                      Hide
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleUpdate(video._id, { status: "REMOVED" })}
                      disabled={actionLoading === video._id || video.status === "REMOVED"}
                    >
                      Remove
                    </Button>
                    <Button
                      size="small"
                      variant={video.isFake ? "contained" : "outlined"}
                      color="warning"
                      onClick={() => handleUpdate(video._id, { isFake: !video.isFake })}
                      disabled={actionLoading === video._id}
                    >
                      {video.isFake ? "Mark Real" : "Mark Fake"}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!videos.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2">No videos found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary">
        Showing {videos.length} of {meta.total || videos.length} videos
      </Typography>
    </Stack>
  );
};

const chipColor = (status) => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "HIDDEN":
      return "warning";
    case "REMOVED":
      return "error";
    default:
      return "default";
  }
};

export default VideosPage;
