"use client";

import { useCallback, useEffect, useState } from "react";

import {
  Alert,
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
  FormControlLabel,
  FormGroup,
  Grid,
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
  Tooltip,
  Typography,
  Checkbox,
} from "@mui/material";
import { Add, Cancel, Refresh, Shield } from "@mui/icons-material";

import {
  listSubAdminAssignments,
  listSubAdminInvites,
  createSubAdminInvite,
  cancelSubAdminInvite,
} from "@/services/v2/subAdmins";
import { assignRole, revokeRole } from "@/services/v2/users";

const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "MODERATOR"];

const permissionOptions = [
  { key: "dashboard", label: "Dashboard" },
  { key: "reports", label: "Reports" },
  { key: "live-monitor", label: "Live Monitor" },
  { key: "users", label: "Users" },
  { key: "social", label: "Follower Analytics" },
  { key: "hosts", label: "Hosts" },
  { key: "agencies", label: "Agencies" },
  { key: "bdm", label: "BDM Toolkit" },
  { key: "coin-plans", label: "Coin Plans" },
  { key: "coin-traders", label: "Coin Traders" },
  { key: "wallet", label: "Wallet" },
  { key: "finance", label: "Finance" },
  { key: "payouts", label: "Payouts" },
  { key: "payments", label: "Payments" },
  { key: "gift-history", label: "Gift History" },
  { key: "store-items", label: "Store Items" },
  { key: "content", label: "Content Moderation" },
  { key: "moderation", label: "User Reports" },
  { key: "notifications", label: "Notifications" },
  { key: "help-center", label: "Help Center" },
  { key: "settings", label: "System Settings" },
];

const allPermissionKeys = permissionOptions.map(option => option.key);
const permissionLabelMap = permissionOptions.reduce((acc, option) => ({ ...acc, [option.key]: option.label }), {});

const defaultInviteForm = { email: "", roleName: "ADMIN", expiresInDays: 7, notes: "", allowedModules: allPermissionKeys };

const defaultGrantForm = {
  userId: "",
  roleName: "ADMIN",
  scopeType: "GLOBAL",
  scopeRefId: "",
  allowedModules: allPermissionKeys,
};

const SubAdminsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentData, inviteData] = await Promise.all([listSubAdminAssignments(), listSubAdminInvites()]);

      setAssignments(assignmentData);
      setInvites(inviteData);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load sub-admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRevoke = async (assignment) => {
    if (!window.confirm(`Remove ${assignment.roleName} role from ${assignment.userId?.displayName || assignment.userId?._id}?`)) {
      return;
    }

    setSubmitting(true);

    try {
      await revokeRole(assignment.userId?._id, assignment._id);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm("Cancel this invite?")) return;
    setSubmitting(true);

    try {
      await cancelSubAdminInvite(inviteId);
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

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <div>
          <Typography variant="h5">Sub-admins & Roles</Typography>
          <Typography variant="body2" color="text.secondary">
            Invite new administrators, assign roles, and monitor elevated access.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Button startIcon={<Add />} variant="outlined" onClick={() => setGrantDialogOpen(true)}>
            Grant Role
          </Button>
          <Button startIcon={<Shield />} variant="contained" onClick={() => setInviteDialogOpen(true)}>
            Invite Sub-admin
          </Button>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <SummaryCard label="Active Admin Roles" value={assignments.length} />
        <SummaryCard label="Pending Invites" value={invites.filter((invite) => invite.status === "PENDING").length} />
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
            <Typography variant="h6">Active Assignments</Typography>
            <Typography variant="body2" color="text.secondary">
              Roles applied directly to existing user accounts.
            </Typography>
          </Stack>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment._id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>{assignment.userId?.displayName || assignment.userId?.email || "Unknown"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {assignment.userId?.email || assignment.userId?._id}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{assignment.roleName}</TableCell>
                    <TableCell>{assignment.scopeType || "GLOBAL"}</TableCell>
                    <TableCell>
                      <PermissionBadges modules={assignment.allowedModules} />
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRevoke(assignment)}
                        disabled={submitting}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!assignments.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2">No assignments yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
            <Typography variant="h6">Pending Invites</Typography>
            <Typography variant="body2" color="text.secondary">
              Invites reserve email addresses until the user signs in via Firebase.
            </Typography>
          </Stack>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite._id} hover>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.roleName}</TableCell>
                    <TableCell>
                      <PermissionBadges modules={invite.allowedModules} />
                    </TableCell>
                    <TableCell>{invite.status}</TableCell>
                    <TableCell>
                      {new Date(invite.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={invite.inviteToken}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {invite.inviteToken.slice(0, 6)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {invite.status === "PENDING" ? (
                        <IconButton size="small" onClick={() => handleCancelInvite(invite._id)} disabled={submitting}>
                          <Cancel fontSize="inherit" />
                        </IconButton>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!invites.length && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2">No invites yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <InviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            await createSubAdminInvite(payload);
            setInviteDialogOpen(false);
            await loadData();
          } finally {
            setSubmitting(false);
          }
        }}
      />

      <GrantRoleDialog
        open={grantDialogOpen}
        onClose={() => setGrantDialogOpen(false)}
        onSubmit={async (payload) => {
          setSubmitting(true);

          try {
            await assignRole(payload.userId, {
              roleName: payload.roleName,
              scopeType: payload.scopeType,
              scopeRefId: payload.scopeRefId,
              allowedModules: payload.allowedModules,
            });
            setGrantDialogOpen(false);
            await loadData();
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Stack>
  );
};

const SummaryCard = ({ label, value }) => (
  <Card sx={{ flex: 1 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const PermissionBadges = ({ modules }) => {
  const normalized = Array.isArray(modules) ? modules : [];

  if (!normalized.length) {
    return <Chip size="small" label="All modules" color="primary" variant="outlined" />;
  }

  const visible = normalized.slice(0, 3);

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {visible.map((key) => (
        <Chip key={key} size="small" label={permissionLabelMap[key] || key} />
      ))}
      {normalized.length > visible.length && (
        <Chip size="small" variant="outlined" label={`+${normalized.length - visible.length}`} />
      )}
    </Stack>
  );
};

const PermissionsPicker = ({ value, onChange }) => {
  const selected = Array.isArray(value) ? value : [];

  const toggleModule = (moduleKey) => {
    if (selected.includes(moduleKey)) {
      onChange(selected.filter((key) => key !== moduleKey));
    } else {
      onChange([...selected, moduleKey]);
    }
  };

  const handleSelectAll = () => onChange(allPermissionKeys);
  const handleClear = () => onChange([]);

  return (
    <Stack spacing={1} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="subtitle2">Module Access</Typography>
        <Button size="small" onClick={handleSelectAll}>
          Select all
        </Button>
        <Button size="small" onClick={handleClear}>
          Clear
        </Button>
        <Typography variant="caption" color="text.secondary">
          {selected.length === allPermissionKeys.length ? "Full access" : `${selected.length} selected`}
        </Typography>
      </Stack>
      <Grid container spacing={1} columns={{ xs: 12, sm: 12, md: 12 }}>
        {permissionOptions.map((option) => (
          <Grid item xs={12} sm={6} key={option.key}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selected.includes(option.key)}
                  onChange={() => toggleModule(option.key)}
                />
              }
              label={option.label}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

const InviteDialog = ({ open, onClose, onSubmit }) => {
  const createInitialForm = () => ({ ...defaultInviteForm, allowedModules: [...defaultInviteForm.allowedModules] });
  const [form, setForm] = useState(createInitialForm);

  useEffect(() => {
    if (open) {
      setForm(createInitialForm());
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePermissionsChange = modules => {
    setForm(prev => ({ ...prev, allowedModules: modules }));
  };

  const handleSubmit = async () => {
    if (!form.allowedModules?.length) {
      alert("Select at least one module");

      return;
    }

    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite a Sub-admin</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Email" value={form.email} onChange={handleChange("email")} />
          <TextField label="Role" select value={form.roleName} onChange={handleChange("roleName")}>
            {adminRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Expires in (days)"
            type="number"
            value={form.expiresInDays}
            onChange={handleChange("expiresInDays")}
            inputProps={{ min: 1, max: 30 }}
          />
          <TextField label="Notes (optional)" multiline rows={3} value={form.notes} onChange={handleChange("notes")} />
          <PermissionsPicker value={form.allowedModules} onChange={handlePermissionsChange} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Send Invite
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const GrantRoleDialog = ({ open, onClose, onSubmit }) => {
  const createInitialForm = () => ({ ...defaultGrantForm, allowedModules: [...defaultGrantForm.allowedModules] });
  const [form, setForm] = useState(createInitialForm);

  useEffect(() => {
    if (open) {
      setForm(createInitialForm());
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePermissionsChange = modules => {
    setForm(prev => ({ ...prev, allowedModules: modules }));
  };

  const handleSubmit = async () => {
    if (!form.userId) {
      alert("User ID is required");

return;
    }

    if (!form.allowedModules?.length) {
      alert("Select at least one module");

      return;
    }

    await onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Grant Role</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="User ID" value={form.userId} onChange={handleChange("userId")} helperText="Use search in Users tab to copy the Mongo ID." />
          <TextField label="Role" select value={form.roleName} onChange={handleChange("roleName")}>
            {adminRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Scope" value={form.scopeType} onChange={handleChange("scopeType")} helperText="GLOBAL, AGENCY, BD_TEAM, REGION" />
          <TextField label="Scope Reference (optional)" value={form.scopeRefId} onChange={handleChange("scopeRefId")} />
          <PermissionsPicker value={form.allowedModules} onChange={handlePermissionsChange} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<Shield />} onClick={handleSubmit}>
          Apply Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubAdminsPage;
