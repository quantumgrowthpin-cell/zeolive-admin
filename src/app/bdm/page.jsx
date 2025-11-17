"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import { fetchAgencies, createBdTeamMember, assignHostToAgency } from "@/services/v2/agencies";
import { fetchUsers, assignRole } from "@/services/v2/users";
import { listReferralSystems } from "@/services/v2/referralSystems";

const BdmPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [agencyMeta, setAgencyMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: "ALL", country: "ALL" });
  const [teamForm, setTeamForm] = useState({ userId: "", bdManagerId: "", agencyId: "", notes: "" });
  const [assignForm, setAssignForm] = useState({ userId: "", agencyId: "", bdManagerId: "", bdTeamMemberId: "" });
  const [result, setResult] = useState(null);
  const [bdmSearch, setBdmSearch] = useState("");
  const [bdmOptions, setBdmOptions] = useState([]);
  const [bdmLoading, setBdmLoading] = useState(false);
  const [selectedBdm, setSelectedBdm] = useState(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMessage, setPromoteMessage] = useState(null);
  const [countries, setCountries] = useState([]);
  const [referralTiers, setReferralTiers] = useState([]);

  const loadAgencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAgencies({
        status: filters.status !== "ALL" ? filters.status : undefined,
        country: filters.country !== "ALL" ? filters.country : undefined,
        page: agencyMeta.page,
        limit: agencyMeta.limit,
      });

      const list = result.data || [];
      setAgencies(list);
      setAgencyMeta((prev) => ({ ...prev, ...(result.meta || {}) }));
      setCountries(Array.from(new Set(list.map((agency) => agency.country).filter(Boolean))));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load agencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, agencyMeta.page]);

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
    if (!bdmSearch || bdmSearch.length < 2) {
      setBdmOptions(selectedBdm ? [selectedBdm] : []);
      setBdmLoading(false);
      
return;
    }

    let active = true;

    setBdmLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const result = await fetchUsers({ search: bdmSearch, limit: 10 });

        if (active) {
          setBdmOptions(result.items || []);
        }
      } catch (err) {
        if (active) {
          console.warn("Failed to search users for BDM", err);
        }
      } finally {
        if (active) {
          setBdmLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [bdmSearch, selectedBdm]);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;

    setter((prev) => ({ ...prev, [name]: value }));
  };

  const submitTeam = async () => {
    setResult(null);

    try {
      await createBdTeamMember(teamForm);
      setTeamForm({ userId: "", bdManagerId: "", agencyId: "", notes: "" });
      setResult({ type: "success", message: "BD team member added" });
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to add team member" });
    }
  };

  const submitAssign = async () => {
    setResult(null);

    try {
      await assignHostToAgency(assignForm);
      setAssignForm({ userId: "", agencyId: "", bdManagerId: "", bdTeamMemberId: "" });
      setResult({ type: "success", message: "Host assigned successfully" });
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to assign host" });
    }
  };

  const summary = useMemo(() => {
    const active = agencies.filter((agency) => agency.status === "ACTIVE").length;
    return { total: agencyMeta.total || agencies.length, active };
  }, [agencies, agencyMeta.total]);
  const activeTiers = referralTiers.filter((tier) => tier.isActive);
  const nextTier = activeTiers[0];

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[60dvh]">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={loadAgencies}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h5">BDM Toolkit</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage BD team assignments, referral tiers, and host onboarding for agencies.
        </Typography>
      </div>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Total Agencies" value={summary.total} helper={`Active: ${summary.active}`} />
        <SummaryCard
          label="Referral Tiers"
          value={activeTiers.length}
          helper={nextTier ? `Next reward: ${nextTier.targetReferrals} → ${nextTier.rewardCoins} coins` : "No tiers configured"}
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="SUSPENDED">Suspended</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
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
        <Button onClick={loadAgencies}>Refresh</Button>
      </Stack>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}
      {promoteMessage && (
        <Alert severity={promoteMessage.type} onClose={() => setPromoteMessage(null)}>
          {promoteMessage.message}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Promote user to BDM
              </Typography>
              <Stack spacing={2}>
                <Autocomplete
                  options={bdmOptions}
                  loading={bdmLoading}
                  value={selectedBdm}
                  onChange={(_, newValue) => {
                    setSelectedBdm(newValue);
                  }}
                  inputValue={bdmSearch}
                  onInputChange={(_, newInput) => setBdmSearch(newInput)}
                  getOptionLabel={(option) => option?.displayName ? `${option.displayName} (${option.email})` : option?.email || ""}
                  isOptionEqualToValue={(option, value) => option?._id === value?._id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search existing user"
                      placeholder="Name, email, or user id"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {bdmLoading ? <CircularProgress size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Typography variant="caption" color="text.secondary">
                  Pick an existing account to grant `BDM` role. They’ll automatically see BDM tools in the app.
                </Typography>
                <Button
                  variant="contained"
                  disabled={!selectedBdm || promoteLoading}
                  onClick={async () => {
                    if (!selectedBdm) return;
                    setPromoteMessage(null);
                    setPromoteLoading(true);

                    try {
                      await assignRole(selectedBdm._id, { roleName: "BDM", scopeType: "GLOBAL" });
                      setPromoteMessage({ type: "success", message: `${selectedBdm.displayName || selectedBdm.email} promoted to BDM.` });
                    } catch (err) {
                      setPromoteMessage({ type: "error", message: err?.response?.data?.message || err.message || "Failed to promote user" });
                    } finally {
                      setPromoteLoading(false);
                    }
                  }}
                >
                  {promoteLoading ? "Applying..." : "Grant BDM access"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Add BD Team Member
              </Typography>
              <Stack spacing={2}>
                <TextField label="Team Member User ID" name="userId" value={teamForm.userId} onChange={handleChange(setTeamForm)} />
                <TextField label="BD Manager ID" name="bdManagerId" value={teamForm.bdManagerId} onChange={handleChange(setTeamForm)} />
                <TextField label="Agency ID" name="agencyId" value={teamForm.agencyId} onChange={handleChange(setTeamForm)} helperText="Optional if manager already linked to agency" />
                <TextField label="Notes" name="notes" value={teamForm.notes} onChange={handleChange(setTeamForm)} multiline minRows={2} />
                <Button variant="contained" onClick={submitTeam}>
                  Save Member
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Assign Host to Agency
              </Typography>
              <Stack spacing={2}>
                <TextField label="Host User ID" name="userId" value={assignForm.userId} onChange={handleChange(setAssignForm)} />
                <TextField label="Agency ID" name="agencyId" value={assignForm.agencyId} onChange={handleChange(setAssignForm)} />
                <TextField label="BD Manager ID" name="bdManagerId" value={assignForm.bdManagerId} onChange={handleChange(setAssignForm)} />
                <TextField
                  label="BD Team Member ID"
                  name="bdTeamMemberId"
                  value={assignForm.bdTeamMemberId}
                  onChange={handleChange(setAssignForm)}
                  helperText="Optional - assign to specific recruiter"
                />
                <Button variant="contained" onClick={submitAssign}>
                  Assign Host
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Card}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Agency</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agencies.map((agency) => (
              <TableRow key={agency._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{agency.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    slug: {agency.slug}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{agency.ownerUserId?.displayName || agency.ownerUserId?.email || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agency.ownerUserId?.email || "—"}
                  </Typography>
                </TableCell>
                <TableCell>{agency.country || "—"}</TableCell>
                <TableCell>
                  <Typography variant="body2">{agency.contactEmail || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agency.contactPhone || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={agency.status} color={agency.status === "ACTIVE" ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default BdmPage;

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
