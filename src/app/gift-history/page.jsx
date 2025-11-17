"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
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

import { Download, Sparkles } from "lucide-react";

import { fetchGiftHistory, fetchGiftStats, exportGiftHistoryCsv } from "@/services/v2/giftHistory";

const GiftHistoryPage = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ senderId: "", receiverId: "", giftId: "", referenceType: "", limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportGiftHistoryCsv(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "gift-history.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchGiftHistory({
        senderId: filters.senderId || undefined,
        receiverId: filters.receiverId || undefined,
        giftId: filters.giftId || undefined,
        referenceType: filters.referenceType || undefined,
        limit: filters.limit,
      });

      setEntries(result.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load gift history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    fetchGiftStats()
      .then(setSummary)
      .catch(() => setSummary(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Gift Transactions</Typography>
        <Typography variant="body2" color="text.secondary">
          Audit who is sending gifts, how many coins they spend, and where the transactions took place.
        </Typography>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {summary && (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Gifts
                  </Typography>
                  <Typography variant="h5">{summary.totals?.totalGifts?.toLocaleString() || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Coins moved: {summary.totals?.totalCoins?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Top Gifts
                  </Typography>
                  <Stack spacing={0.5}>
                    {summary.topGifts?.length ? (
                      summary.topGifts.map(item => (
                        <Stack key={item._id} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{item.gift?.name || item._id}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.count} sends
                          </Typography>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2">No gift activity.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Lucky hits</Typography>
                    <Sparkles size={16} />
                  </Stack>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {summary.luckyHits?.length ? (
                      summary.luckyHits.map(hit => (
                        <Stack key={hit._id} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{hit.gift?.name || hit._id}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {hit.count} hits
                          </Typography>
                        </Stack>
                      ))
                    ) : (
                      <Typography variant="body2">No lucky triggers.</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
                <Typography variant="subtitle1">Reference & stream breakdown</Typography>
                <Button variant="outlined" onClick={handleExport} startIcon={<Download size={16} />} disabled={exporting}>
                  {exporting ? "Exporting…" : "Export CSV"}
                </Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Reference mix
                  </Typography>
                  {summary.referenceBreakdown?.length ? (
                    <Stack spacing={1}>
                      {summary.referenceBreakdown.map(item => (
                        <Stack key={item._id || "unknown"} direction="row" justifyContent="space-between" alignItems="center">
                          <Chip size="small" label={item._id || "Other"} variant="outlined" />
                          <Typography variant="body2" color="text.secondary">
                            {item.count} gifts · {item.coins?.toLocaleString() || 0} coins
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No reference breakdown available.
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Top live streams
                  </Typography>
                  {summary.streamBreakdown?.length ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stream</TableCell>
                          <TableCell>Host</TableCell>
                          <TableCell align="right">Coins</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summary.streamBreakdown.map(entry => (
                          <TableRow key={`${entry._id.referenceId}-${entry._id.referenceType}`}>
                            <TableCell>
                              <Typography variant="body2">{entry._id.referenceType}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry._id.referenceId || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>{entry.receiver?.displayName || entry.receiverId || "—"}</TableCell>
                            <TableCell align="right">{entry.coins?.toLocaleString() || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No live stream data for the selected filters.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {summary.luckyStreaks?.length ? (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Lucky streaks (per stream)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Gift</TableCell>
                      <TableCell>Stream</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell align="right">Hits</TableCell>
                      <TableCell align="right">Coins</TableCell>
                      <TableCell>Window</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.luckyStreaks.map(entry => (
                      <TableRow key={`${entry._id.referenceId}-${entry._id.giftId}`}>
                        <TableCell>{entry.gift?.name || entry._id.giftId}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{entry.referenceType || "—"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry._id.referenceId || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{entry.receiver?.displayName || entry.primaryReceiverId || "—"}</TableCell>
                        <TableCell align="right">{entry.hits}</TableCell>
                        <TableCell align="right">{entry.coins?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {entry.firstHit ? new Date(entry.firstHit).toLocaleString() : "—"} – {entry.lastHit ? new Date(entry.lastHit).toLocaleString() : "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </Stack>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField size="small" label="Sender ID" value={filters.senderId} onChange={event => setFilters(prev => ({ ...prev, senderId: event.target.value }))} />
            <TextField size="small" label="Receiver ID" value={filters.receiverId} onChange={event => setFilters(prev => ({ ...prev, receiverId: event.target.value }))} />
            <TextField size="small" label="Gift ID" value={filters.giftId} onChange={event => setFilters(prev => ({ ...prev, giftId: event.target.value }))} />
            <TextField size="small" label="Reference Type" value={filters.referenceType} onChange={event => setFilters(prev => ({ ...prev, referenceType: event.target.value }))} />
            <TextField size="small" type="number" label="Limit" value={filters.limit} onChange={event => setFilters(prev => ({ ...prev, limit: Number(event.target.value) || 50 }))} />
            <Button variant="contained" onClick={loadHistory} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sender</TableCell>
              <TableCell>Receiver</TableCell>
              <TableCell>Gift</TableCell>
              <TableCell>Coins</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading history...
                </TableCell>
              </TableRow>
            )}
            {!loading && !entries.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No gift transactions found.
                </TableCell>
              </TableRow>
            )}
            {entries.map(entry => (
              <TableRow key={entry._id}>
                <TableCell>{entry.senderId?.displayName || entry.senderId || "—"}</TableCell>
                <TableCell>{entry.receiverId?.displayName || entry.receiverId || "—"}</TableCell>
                <TableCell>{entry.giftId?.name || entry.giftId || "—"}</TableCell>
                <TableCell>{entry.coinsSpent?.toLocaleString() || 0}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {entry.referenceType || "—"}
                  </Typography>
                  <div>{entry.referenceId || ""}</div>
                </TableCell>
                <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default GiftHistoryPage;
