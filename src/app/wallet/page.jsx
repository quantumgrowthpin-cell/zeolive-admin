"use client";

import { useEffect, useState } from "react";

import {
  Alert,
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

import { fetchWalletHistory, creditWallet } from "@/services/v2/wallet";

const WalletPage = () => {
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topup, setTopup] = useState({ amount: 100, balanceType: "coin" });
  const [result, setResult] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWalletHistory({});

      setHistory(data.items || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load wallet history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTopup = async () => {
    setResult(null);

    try {
      await creditWallet(topup);
      setResult({ type: "success", message: "Wallet credited (mock)" });
      await loadHistory();
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to credit wallet" });
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
        <Button variant="contained" onClick={loadHistory}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Wallet History</Typography>
          <Typography variant="body2" color="text.secondary">
            Trace wallet credits/debits recorded by backend-v2.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Amount"
            type="number"
            size="small"
            value={topup.amount}
            onChange={(event) => setTopup((prev) => ({ ...prev, amount: Number(event.target.value) }))}
          />
          <TextField
            select
            size="small"
            label="Balance"
            value={topup.balanceType}
            onChange={(event) => setTopup((prev) => ({ ...prev, balanceType: event.target.value }))}
          >
            <MenuItem value="coin">Coin</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleTopup}>
            Mock Credit
          </Button>
        </Stack>
      </Stack>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell>{entry.type}</TableCell>
                <TableCell align="right">{entry.amount}</TableCell>
                <TableCell>{entry.referenceType || "—"}</TableCell>
                <TableCell>
                  {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default WalletPage;
