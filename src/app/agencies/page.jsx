"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Edit, Delete } from "@mui/icons-material";

import { fetchAgencies, createAgency, updateAgencyStatus, updateAgencyCommission } from "@/services/v2/agencies";
import { fetchUsers } from "@/services/v2/users";
import { uploadImage } from "@/services/v2/uploads";

const statusFilters = ["ALL", "ACTIVE", "SUSPENDED"];
const countries = ["IN", "US", "AE", "SA", "PH", "BR", "NG"];

const defaultForm = {
  ownerUserId: "",
  ownerSearch: "",
  displayName: "",
  slug: "",
  country: "IN",
  contactEmail: "",
  contactPhone: "",
  description: "",
  logoUrl: "",
  commissionRate: "",
};

const AgenciesPage = () => {
  const [agencies, setAgencies] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ status: "ALL" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(null);
  const [commissionDialog, setCommissionDialog] = useState({ open: false, agency: null });

  const loadAgencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAgencies({
        status: filters.status !== "ALL" ? filters.status : undefined,
        page: meta.page,
        limit: meta.limit,
      });
      setAgencies(result.data || []);
      setMeta((prev) => ({ ...prev, ...result.meta }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load agencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, meta.page]);

  const summary = useMemo(() => {
    const active = agencies.filter((agency) => agency.status === "ACTIVE").length;
    return { total: meta.total || agencies.length, active };
  }, [agencies, meta.total]);

  const handleStatusToggle = async (agency, nextStatus) => {
    setActionLoading(agency._id);
    try {
      await updateAgencyStatus({ agencyId: agency._id, status: nextStatus });
      await loadAgencies();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to update agency status");
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
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={loadAgencies}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Agencies</Typography>
          <Typography variant="body2" color="text.secondary">
            Review and onboard agencies. Each agency is owned by a user account with contact details.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            size="small"
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
          <Button variant="contained" onClick={() => setDialog({ open: true })}>
            New Agency
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Total Agencies" value={summary.total} />
        <SummaryCard label="Active" value={summary.active} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Commission</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
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
                  <Typography>{agency.ownerUserId?.displayName || agency.ownerUserId?._id || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agency.ownerUserId?.email || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{agency.contactEmail || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {agency.contactPhone || "—"}
                  </Typography>
                </TableCell>
                <TableCell>{agency.country || "—"}</TableCell>
                <TableCell>{agency.commissionRate ?? 0}%</TableCell>
                <TableCell>
                  <Chip size="small" label={agency.status} color={agency.status === "ACTIVE" ? "success" : "default"} />
                </TableCell>
                <TableCell>{formatDate(agency.createdAt)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => setCommissionDialog({ open: true, agency })}>
                      Commission
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleStatusToggle(agency, agency.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                      disabled={actionLoading === agency._id}
                    >
                      {agency.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!agencies.length && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No agencies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AgencyDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        onSubmit={async (values) => {
          await createAgency(values);
          setDialog({ open: false });
          await loadAgencies();
        }}
      />
      <CommissionDialog
        open={commissionDialog.open}
        agency={commissionDialog.agency}
        onClose={() => setCommissionDialog({ open: false, agency: null })}
        onSubmit={async (payload) => {
          await updateAgencyCommission(payload);
          setCommissionDialog({ open: false, agency: null });
          await loadAgencies();
        }}
      />
    </Stack>
  );
};

const AgencyDialog = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState(defaultForm);
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(defaultForm);
      setOwnerOptions([]);
      setLogoFile(null);
      setLogoPreview("");
    }
  }, [open]);

  useEffect(() => {
    if (!form.ownerSearch || form.ownerSearch.length < 2) {
      setOwnerOptions([]);
      return;
    }

    let active = true;
    setOwnerLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const result = await fetchUsers({ search: form.ownerSearch, limit: 10 });
        if (active) {
          setOwnerOptions(result.items || []);
        }
      } catch (err) {
        if (active) console.warn("Failed to search users", err);
      } finally {
        if (active) setOwnerLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [form.ownerSearch]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    if (name === "displayName") {
      setForm((prev) => ({ ...prev, displayName: value, slug: value ? slugify(value) : prev.slug }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerSelect = (_event, option) => {
    if (option) {
      setForm((prev) => ({
        ...prev,
        ownerUserId: option._id,
        ownerSearch: option.displayName || option.email || option.username || option._id,
      }));
    } else {
      setForm((prev) => ({ ...prev, ownerUserId: "", ownerSearch: "" }));
    }
  };

  const handleLogoChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setLogoFile(selected);
      setLogoPreview(URL.createObjectURL(selected));
    } else {
      setLogoFile(null);
      setLogoPreview("");
    }
  };

  const handleSubmit = async () => {
    if (!form.ownerUserId) {
      alert("Please select an agency owner");
      return;
    }
    if (!form.displayName.trim() || !form.slug.trim()) {
      alert("Agency name and slug are required");
      return;
    }
    setSubmitting(true);

    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        const uploaded = await uploadImage(logoFile);
        logoUrl = uploaded?.url || logoUrl;
      }
      await onSubmit({
        ownerUserId: form.ownerUserId,
        displayName: form.displayName.trim(),
        slug: form.slug.trim().toLowerCase(),
        country: form.country,
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        metadata: {
          description: form.description.trim(),
          logoUrl,
        },
        commissionRate: Number(form.commissionRate) || 0,
      });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Unable to create agency");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Agency</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Autocomplete
          options={ownerOptions}
          getOptionLabel={(option) => option.displayName || option.email || option.username || option._id}
          loading={ownerLoading}
          value={ownerOptions.find((option) => option._id === form.ownerUserId) || null}
          inputValue={form.ownerSearch}
          onInputChange={(_event, value) => setForm((prev) => ({ ...prev, ownerSearch: value }))}
          onChange={handleOwnerSelect}
          renderInput={(params) => <TextField {...params} label="Agency Owner" placeholder="Search users" />}
        />
        <TextField label="Agency Name" name="displayName" value={form.displayName} onChange={handleFieldChange} />
        <TextField label="Slug" name="slug" value={form.slug} onChange={handleFieldChange} helperText="Used in URLs and reports." />
        <TextField select label="Country" name="country" value={form.country} onChange={handleFieldChange}>
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Contact Email"
            name="contactEmail"
            value={form.contactEmail}
            onChange={handleFieldChange}
            fullWidth
          />
          <TextField
            label="Phone"
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleFieldChange}
            fullWidth
          />
        </Stack>
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleFieldChange}
          multiline
          minRows={3}
        />
        <TextField
          label="Commission Rate (%)"
          name="commissionRate"
          type="number"
          value={form.commissionRate}
          onChange={handleFieldChange}
          inputProps={{ min: 0 }}
        />
        <Stack spacing={1}>
          <Typography variant="body2">Agency Logo</Typography>
          <Button variant="outlined" component="label">
            {logoFile ? "Change Logo" : "Upload Logo"}
            <input hidden accept=".jpg,.jpeg,.png,.gif" type="file" onChange={handleLogoChange} />
          </Button>
          {logoPreview && (
            <Box
              component="img"
              src={logoPreview}
              alt="Logo preview"
              sx={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create Agency"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CommissionDialog = ({ open, onClose, agency, onSubmit }) => {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && agency) {
      setValue(agency.commissionRate ?? 0);
    } else {
      setValue("");
    }
  }, [open, agency]);

  const handleSubmit = async () => {
    if (!agency?._id) return;
    setSubmitting(true);
    try {
      await onSubmit({
        agencyId: agency._id,
        commissionRate: Number(value) || 0,
      });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Unable to update commission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Update Commission</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField
          label="Commission Rate (%)"
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputProps={{ min: 0 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SummaryCard = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", minWidth: 160 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value ?? "--"}</Typography>
  </Box>
);

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export default AgenciesPage;
