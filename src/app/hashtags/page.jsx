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
import { Delete, Edit } from "@mui/icons-material";

import { fetchHashtags, createHashtag, updateHashtag, deleteHashtag } from "@/services/v2/hashtags";

const defaultForm = {
  tag: "",
  isActive: true,
};

const HashtagDialog = ({ open, onClose, onSubmit, initialData }) => {
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
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{initialData ? "Edit Hashtag" : "Create Hashtag"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField label="Tag" name="tag" value={form.tag} placeholder="#example" onChange={handleChange} />
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

const HashtagsPage = () => {
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const loadTags = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchHashtags({ includeInactive: true });

      setHashtags(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load hashtags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    if (!search) return hashtags;
    const query = search.toLowerCase();

    
return hashtags.filter((tag) => tag.tag?.toLowerCase().includes(query));
  }, [hashtags, search]);

  const handleCreate = () => {
    setEditingTag(null);
    setDialogOpen(true);
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleSave = async (payload) => {
    const normalized = { ...payload, tag: payload.tag?.replace(/^#/, "").trim() };

    if (!normalized.tag) {
      alert("Tag is required");
      
return;
    }

    if (editingTag) {
      await updateHashtag(editingTag._id, { tag: normalized.tag, isActive: editingTag.isActive });
    } else {
      await createHashtag({ tag: normalized.tag });
    }

    await loadTags();
  };

  const handleDelete = async (hashTagId) => {
    if (!window.confirm("Delete this hashtag?")) return;
    setActionLoading(hashTagId);

    try {
      await deleteHashtag(hashTagId);
      await loadTags();
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
        <Button variant="contained" onClick={loadTags}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
        <div>
          <Typography variant="h5">Hashtags</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage trending tags used across posts and live rooms.
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tags"
          />
          <Button variant="contained" onClick={handleCreate}>
            New Hashtag
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tag</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTags.map((tag) => (
              <TableRow key={tag._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>#{tag.tag}</Typography>
                </TableCell>
                <TableCell>{tag.usageCount ?? 0}</TableCell>
                <TableCell>
                  <Chip label={tag.isActive ? "Active" : "Hidden"} color={tag.isActive ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(tag.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" onClick={() => handleEdit(tag)}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(tag._id)}
                      disabled={actionLoading === tag._id}
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <HashtagDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        initialData={editingTag}
      />
    </Stack>
  );
};

export default HashtagsPage;
