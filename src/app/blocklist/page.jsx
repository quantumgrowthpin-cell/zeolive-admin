"use client";

import { useEffect, useState } from "react";

import { Box, Button, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

import { listBlocklist, unblockEntry } from "@/services/v2/blocklist";

const BlocklistPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listBlocklist();

      setEntries(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load blocklist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnblock = async (entry) => {
    if (!window.confirm("Remove this block entry?")) return;
    setSubmitting(true);

    try {
      await unblockEntry(entry._id);
      await loadData();
    } finally {
      setSubmitting(false);
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
        <Button variant="outlined" onClick={loadData}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Blocklist</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and remove moderation-level blocks between users.
        </Typography>
      </div>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Blocking User</TableCell>
              <TableCell>Blocked User</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{entry.userId?.displayName || entry.userId?.email || entry.userId?._id}</TableCell>
                <TableCell>{entry.blockedUserId?.displayName || entry.blockedUserId?.email || entry.blockedUserId?._id}</TableCell>
                <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" color="error" onClick={() => handleUnblock(entry)} disabled={submitting}>
                    Unblock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!entries.length && (
              <TableRow>
                <TableCell colSpan={4}>No blocked users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default BlocklistPage;
