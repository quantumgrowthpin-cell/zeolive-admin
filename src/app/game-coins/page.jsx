"use client";

import { useEffect, useState } from "react";

import { Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from "@mui/material";

import { fetchGameCoinLedger, adjustGameCoins } from "@/services/v2/gameCoins";

const GameCoinsPage = () => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ delta: 0 });
  const [submitting, setSubmitting] = useState(false);

  const loadLedger = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchGameCoinLedger();

      setLedger(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleAdjust = async () => {
    if (!Number(form.delta)) {
      alert("Enter a delta amount");
      
return;
    }

    setSubmitting(true);

    try {
      await adjustGameCoins(Number(form.delta));
      setForm({ delta: 0 });
      await loadLedger();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
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
        <Button variant="outlined" onClick={loadLedger}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h5">Game Coin Ledger</Typography>
        <Typography variant="body2" color="text.secondary">
          Track and adjust the coin pool used for in-app games.
        </Typography>
      </div>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={4} alignItems={{ md: "center" }}>
            <StatBlock label="Current Coins" value={ledger?.coin ?? 0} />
            <StatBlock label="Peak Reserve" value={ledger?.totalCoin ?? 0} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Adjust Balance
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField
              label="Delta"
              type="number"
              value={form.delta}
              onChange={(event) => setForm({ delta: event.target.value })}
              helperText="Positive to credit, negative to debit"
            />
            <Button variant="contained" onClick={handleAdjust} disabled={submitting}>
              Apply Change
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

const StatBlock = ({ label, value }) => (
  <Stack>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h4">{value}</Typography>
  </Stack>
);

export default GameCoinsPage;
