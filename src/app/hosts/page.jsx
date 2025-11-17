"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Edit, Refresh } from "@mui/icons-material";

import { fetchHosts, updateHostAssignment, updateHostStatus } from "@/services/v2/hosts";
import { fetchAgencies } from "@/services/v2/agencies";
import { listReferralSystems } from "@/services/v2/referralSystems";

const statusOptions = ["ALL", "APPROVED", "PENDING", "REJECTED"];

const HostsPage = () => {
  const [hosts, setHosts] = useState([]);
  const [filters, setFilters] = useState({ status: "ALL", search: "", agencyId: "ALL", country: "ALL" });
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false, data: null });
  const [agencies, setAgencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [referralTiers, setReferralTiers] = useState([]);

  const loadAgencies = async () => {
    const result = await fetchAgencies();

    const agencyList = result.data || [];
    setAgencies(agencyList);
    const uniqueCountries = Array.from(new Set(agencyList.map((agency) => agency.country).filter(Boolean)));
    setCountries(uniqueCountries);
  };

  const loadHosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchHosts({
        status: filters.status !== "ALL" ? filters.status : undefined,
        agencyId: filters.agencyId !== "ALL" ? filters.agencyId : undefined,
        country: filters.country !== "ALL" ? filters.country : undefined,
        search: filters.search || undefined,
        limit: 50,
      });

      setHosts(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load hosts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadTiers = async () => {
      try {
        const tiers = await listReferralSystems();
        setReferralTiers(tiers || []);
      } catch (err) {
        console.warn("Failed to load referral tiers", err);
      }
    };
    loadTiers();
  }, []);

  useEffect(() => {
    loadHosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleStatusUpdate = async (host, nextStatus) => {
    await updateHostStatus(host._id, nextStatus);
    loadHosts();
  };

  const summary = useMemo(() => {
    const totals = hosts.reduce(
      (acc, host) => {
        if (host.onboardingStatus === "APPROVED") acc.approved += 1;
        if (host.onboardingStatus === "PENDING") acc.pending += 1;
        acc.earnings += host.metrics?.lifetimeEarnings || 0;
        
return acc;
      },
      { approved: 0, pending: 0, earnings: 0 }
    );

    
return {
      total: hosts.length,
      approved: totals.approved,
      pending: totals.pending,
      earnings: totals.earnings,
      avgEarnings: hosts.length ? totals.earnings / hosts.length : 0,
    };
  }, [hosts]);
  const activeReferralTiers = useMemo(() => referralTiers.filter((tier) => tier.isActive), [referralTiers]);
  const nextActiveTier = activeReferralTiers[0];

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Hosts</Typography>
          <Typography variant="body2" color="text.secondary">
            View active talent, review their agency assignments, and adjust onboarding state as needed.
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            label="Search"
            value={filters.search}
            onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={filters.status}
            onChange={event => setFilters(prev => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Agency"
            value={filters.agencyId}
            onChange={event => setFilters(prev => ({ ...prev, agencyId: event.target.value }))}
          >
            <MenuItem value="ALL">All</MenuItem>
            {agencies.map(agency => (
              <MenuItem key={agency._id} value={agency._id}>
                {agency.name || agency.displayName || agency._id}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Country"
            value={filters.country}
            onChange={(event) => setFilters((prev) => ({ ...prev, country: event.target.value }))}
          >
            <MenuItem value="ALL">All</MenuItem>
            {countries.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </TextField>
          <IconButton onClick={loadHosts}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Total Hosts" value={summary.total} helper={`Approved: ${summary.approved} · Pending: ${summary.pending}`} />
        <SummaryCard label="Lifetime Earnings" value={summary.earnings.toLocaleString()} helper={`Avg per host: ${summary.avgEarnings.toFixed(0)}`} />
        <SummaryCard
          label="Referral Tiers"
          value={`${activeReferralTiers.length} active`}
          helper={
            nextActiveTier
              ? `Next reward: ${nextActiveTier.targetReferrals} referrals → ${nextActiveTier.rewardCoins} coins`
              : "No tiers configured"
          }
        />
      </Stack>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Host</TableCell>
              <TableCell>Agency</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Talent Level</TableCell>
              <TableCell>Earnings</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading hosts...
                </TableCell>
              </TableRow>
            )}
            {!loading && !hosts.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hosts found.
                </TableCell>
              </TableRow>
            )}
            {hosts.map(host => (
              <TableRow key={host._id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{host.user?.displayName || "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {host.user?.email || host.user?.phoneNumber || "—"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {host.agency?.displayName || "Unassigned"}
                  {host.agency?.ownerUserId?.displayName && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Owner: {host.agency.ownerUserId.displayName}
                    </Typography>
                  )}
                  {host.agency?.contactEmail && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {host.agency.contactEmail}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{host.agency?.country || "—"}</TableCell>
                <TableCell>
                  <Chip size="small" label={host.onboardingStatus} color={host.onboardingStatus === "APPROVED" ? "success" : host.onboardingStatus === "REJECTED" ? "error" : "default"} />
                </TableCell>
                <TableCell>{host.talentLevel || "STANDARD"}</TableCell>
                <TableCell>{host.metrics?.lifetimeEarnings?.toLocaleString?.() || "0"}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" onClick={() => handleStatusUpdate(host, host.onboardingStatus === "APPROVED" ? "REJECTED" : "APPROVED")}>
                      {host.onboardingStatus === "APPROVED" ? "Suspend" : "Approve"}
                    </Button>
                    <IconButton size="small" onClick={() => setDialog({ open: true, data: host })}>
                      <Edit fontSize="inherit" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <HostDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, data: null })}
        host={dialog.data}
        agencies={agencies}
        onSave={async payload => {
          await updateHostAssignment(dialog.data._id, payload);
          setDialog({ open: false, data: null });
          loadHosts();
        }}
      />
    </Stack>
  );
};

const HostDialog = ({ open, onClose, host, agencies, onSave }) => {
  const [form, setForm] = useState({
    agencyId: host?.agency?._id || host?.agencyId || "",
    bdManagerId: host?.bdManagerId || "",
    bdTeamMemberId: host?.bdTeamMemberId || "",
  });

  useEffect(() => {
    setForm({
      agencyId: host?.agency?._id || host?.agencyId || "",
      bdManagerId: host?.bdManagerId || "",
      bdTeamMemberId: host?.bdTeamMemberId || "",
    });
  }, [host]);

  if (!host) return null;

  const handleChange = event => {
    const { name, value } = event.target;

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    await onSave({
      agencyId: form.agencyId || null,
      bdManagerId: form.bdManagerId || null,
      bdTeamMemberId: form.bdTeamMemberId || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Host Assignment</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          select
          label="Agency"
          name="agencyId"
          value={form.agencyId}
          onChange={handleChange}
        >
          <MenuItem value="">Unassigned</MenuItem>
          {agencies.map(agency => (
            <MenuItem key={agency._id} value={agency._id}>
              {agency.name || agency.displayName || agency._id}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="BD Manager ID" name="bdManagerId" value={form.bdManagerId} onChange={handleChange} />
        <TextField label="BD Team Member ID" name="bdTeamMemberId" value={form.bdTeamMemberId} onChange={handleChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SummaryCard = ({ label, value, helper }) => (
  <Card sx={{ flex: 1 }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">{value ?? "--"}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default HostsPage;
