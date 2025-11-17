"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Delete, Edit, PlayArrow, Stop } from "@mui/icons-material";

import {
  fetchFakeStreams,
  createFakeStream,
  updateFakeStream,
  toggleFakeStream,
  deleteFakeStream,
} from "@/services/v2/fakeLive";

const streamTypes = [
  { value: 1, label: "Video Live" },
  { value: 2, label: "Audio Room" },
  { value: 3, label: "PK" },
];

const defaultForm = {
  userId: "",
  streamType: 1,
  thumbnailType: 1,
  thumbnail: "",
  streamSourceType: 1,
  streamSource: "",
  roomName: "",
  roomWelcome: "",
  pkThumbnails: "",
  pkStreamSources: "",
};

const FakeStreamDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(initialData || defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialData || defaultForm);
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      const payload = {
        ...form,
        streamType: Number(form.streamType),
        thumbnailType: Number(form.thumbnailType),
        streamSourceType: Number(form.streamSourceType),
        pkThumbnails: splitCsv(form.pkThumbnails),
        pkStreamSources: splitCsv(form.pkStreamSources),
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to save stream entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? "Edit Fake Stream" : "Create Fake Stream"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField label="User ID" name="userId" value={form.userId} onChange={handleChange} />
        <TextField select label="Stream Type" name="streamType" value={form.streamType} onChange={handleChange}>
          {streamTypes.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Thumbnail Type" name="thumbnailType" value={form.thumbnailType} onChange={handleChange}>
          <MenuItem value={1}>URL</MenuItem>
          <MenuItem value={2}>Upload (provide path)</MenuItem>
        </TextField>
        <TextField label="Thumbnail" name="thumbnail" value={form.thumbnail} onChange={handleChange} />
        <TextField
          select
          label="Source Type"
          name="streamSourceType"
          value={form.streamSourceType}
          onChange={handleChange}
        >
          <MenuItem value={1}>URL</MenuItem>
          <MenuItem value={2}>Upload (provide path)</MenuItem>
        </TextField>
        <TextField label="Stream Source" name="streamSource" value={form.streamSource} onChange={handleChange} />
        {Number(form.streamType) === 3 && (
          <>
            <TextField
              label="PK Thumbnails (comma separated)"
              name="pkThumbnails"
              value={form.pkThumbnails}
              onChange={handleChange}
            />
            <TextField
              label="PK Sources (comma separated)"
              name="pkStreamSources"
              value={form.pkStreamSources}
              onChange={handleChange}
            />
          </>
        )}
        <TextField label="Room Name" name="roomName" value={form.roomName} onChange={handleChange} />
        <TextField label="Welcome Message" name="roomWelcome" value={form.roomWelcome} onChange={handleChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const splitCsv = (value) => {
  if (!value) return [];
  
return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const FakeLivePage = () => {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadStreams = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchFakeStreams({ streamType: typeFilter !== "ALL" ? Number(typeFilter) : undefined });

      setStreams(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load fake streams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const filteredStreams = useMemo(() => {
    if (!search) return streams;
    const query = search.toLowerCase();

    
return streams.filter((stream) => {
      return stream.roomName?.toLowerCase().includes(query) || stream.userId?.toLowerCase().includes(query);
    });
  }, [streams, search]);

  const handleCreate = () => {
    setEditingStream(null);
    setDialogOpen(true);
  };

  const handleEdit = (stream) => {
    setEditingStream({
      ...stream,
      pkThumbnails: (stream.pkThumbnails || []).join(", "),
      pkStreamSources: (stream.pkStreamSources || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingStream) {
      await updateFakeStream(editingStream._id, payload);
    } else {
      await createFakeStream(payload);
    }

    await loadStreams();
  };

  const handleToggle = async (stream) => {
    setActionLoading(stream._id);

    try {
      await toggleFakeStream(stream._id, !stream.isStreaming);
      await loadStreams();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (streamId) => {
    if (!window.confirm("Delete fake stream configuration?")) return;
    setActionLoading(streamId);

    try {
      await deleteFakeStream(streamId);
      await loadStreams();
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
        <Button variant="contained" onClick={loadStreams}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
        <div>
          <Typography variant="h5">Fake Live Streams</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure scripted live rooms for onboarding demos.
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} size="small" />
          <TextField select label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} size="small">
            <MenuItem value="ALL">All</MenuItem>
            {streamTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleCreate}>
            Configure Stream
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStreams.map((stream) => (
              <TableRow key={stream._id} hover>
                <TableCell>
                  <Typography variant="body2">{stream.userId}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    #{stream._id?.slice(-6)}
                  </Typography>
                </TableCell>
                <TableCell>{streamTypes.find((t) => t.value === stream.streamType)?.label || stream.streamType}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {stream.streamSource || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{stream.roomName || "—"}</Typography>
                    <Typography variant="caption">{stream.roomWelcome || "No welcome message"}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={stream.isStreaming ? "Streaming" : "Stopped"} color={stream.isStreaming ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => handleToggle(stream)} disabled={actionLoading === stream._id}>
                      {stream.isStreaming ? <Stop fontSize="inherit" /> : <PlayArrow fontSize="inherit" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(stream)}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(stream._id)} disabled={actionLoading === stream._id}>
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <FakeStreamDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        initialData={editingStream}
      />
    </Stack>
  );
};

export default FakeLivePage;
