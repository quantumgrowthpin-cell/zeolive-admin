"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
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

import { fetchPaymentTransactions } from "@/services/v2/payments";

const statusOptions = ["ALL", "PENDING", "SUCCESS", "FAILED"];
const providerOptions = ["ALL", "STRIPE", "RAZORPAY", "GOOGLE_PLAY", "FLUTTERWAVE", "MANUAL"];

const PaymentsPage = () => {
  const [filters, setFilters] = useState({ status: "ALL", provider: "ALL" });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPaymentTransactions({
        status: filters.status !== "ALL" ? filters.status : undefined,
        provider: filters.provider !== "ALL" ? filters.provider : undefined,
      });

      setTransactions(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const totals = transactions.reduce(
    (acc, tx) => {
      acc.count += 1;
      acc.amount += Number(tx.amount || 0);
      if (tx.status === "SUCCESS") acc.success += 1;
      
return acc;
    },
    { count: 0, amount: 0, success: 0 }
  );

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
        <Button variant="contained" onClick={loadTransactions}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Payment Transactions</Typography>
          <Typography variant="body2" color="text.secondary">
            Review top-ups and coin purchases processed by backend-v2.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            size="small"
            label="Status"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Provider"
            value={filters.provider}
            onChange={(event) => setFilters((prev) => ({ ...prev, provider: event.target.value }))}
          >
            {providerOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryTile label="Transactions" value={totals.count} />
        <SummaryTile label="Successful" value={totals.success} />
        <SummaryTile label="Total Amount" value={totals.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Transaction</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id} hover>
                <TableCell>
                  <Typography variant="body2">#{tx._id.slice(-8)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tx.coinPlanId ? `Plan: ${tx.coinPlanId}` : ""}
                  </Typography>
                </TableCell>
                <TableCell>{tx.userId || "—"}</TableCell>
                <TableCell>{tx.provider}</TableCell>
                <TableCell align="right">
                  {tx.amount?.toLocaleString?.("en-US", { style: "currency", currency: tx.currency || "USD" }) || tx.amount}
                </TableCell>
                <TableCell>
                  <Chip label={tx.status} color={chipColorForStatus(tx.status)} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

const SummaryTile = ({ label, value }) => (
  <Card sx={{ flex: 1 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value ?? "--"}</Typography>
    </CardContent>
  </Card>
);

const chipColorForStatus = (status) => {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "default";
  }
};

export default PaymentsPage;
