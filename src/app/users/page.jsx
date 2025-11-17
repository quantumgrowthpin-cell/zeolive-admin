"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { Shield, Delete } from "@mui/icons-material";

import {
  fetchUsers,
  fetchUserDetails,
  updateUserStatus,
  fetchUserRoles,
  assignRole,
  revokeRole,
} from "@/services/v2/users";

const statusOptions = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"];
const roleOptions = ["ADMIN", "MANAGER", "BDM", "AGENCY", "HOST", "USER"];
const filterRoles = ["ALL", ...roleOptions];

const UsersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({ search: "", status: "ALL", role: "ALL" });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [focusHandled, setFocusHandled] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchUsers({
        search: filters.search || undefined,
        status: filters.status !== "ALL" ? filters.status : undefined,
        role: filters.role !== "ALL" ? filters.role : undefined,
      });

      setUsers(data.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const openUserDetails = async (userId) => {
    setDetailDialogOpen(true);
    const [details, roles] = await Promise.all([fetchUserDetails(userId), fetchUserRoles(userId)]);

    setSelectedUser({ ...details, roles });
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setDetailDialogOpen(false);
  };

  const handleStatusUpdate = async (userId, status) => {
    await updateUserStatus({ userId, status });
    await loadUsers();
  };

  useEffect(() => {
    const focusId = searchParams?.get("focus");
    if (!focusId || focusHandled) return;
    setFocusHandled(true);
    openUserDetails(focusId)
      .catch(() => setFocusHandled(false))
      .finally(() => {
        router.replace("/users");
      });
  }, [searchParams, focusHandled]);

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
        <Button variant="contained" onClick={loadUsers}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
        <div>
          <Typography variant="h5">Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Search and manage user accounts, roles, and balances.
          </Typography>
        </div>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            size="small"
            placeholder="Search (name, email, ID)"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
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
            label="Role"
            value={filters.role}
            onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
          >
            {filterRoles.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell align="right">Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={user.avatarUrl}>{user.displayName?.[0] || "U"}</Avatar>
                    <div>
                      <Typography fontWeight={600}>{user.displayName || user.email || user._id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email || "—"}
                      </Typography>
                    </div>
                  </Stack>
                </TableCell>
                <TableCell align="right">{(user.defaultRoles || []).join(", ")}</TableCell>
                <TableCell>
                  <Chip label={user.status} color={chipColorForStatus(user.status)} size="small" />
                </TableCell>
                <TableCell>
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                    : "—"}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => openUserDetails(user._id)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!users.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2">No users match the filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UserDetailDialog
        open={detailDialogOpen}
        onClose={closeDetails}
        user={selectedUser}
        onStatusUpdate={handleStatusUpdate}
      />
    </Stack>
  );
};

const UserDetailDialog = ({ open, onClose, user, onStatusUpdate }) => {
  const [roleForm, setRoleForm] = useState({ roleName: "HOST", scopeType: "GLOBAL" });
  const [refreshRoles, setRefreshRoles] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    setRoleForm({ roleName: "HOST", scopeType: "GLOBAL" });
    setTab("overview");
  }, [user]);

  if (!user) return null;

  const handleAssignRole = async () => {
    await assignRole(user.info._id, roleForm);
    user.roles = await fetchUserRoles(user.info._id);
    setRefreshRoles(!refreshRoles);
  };

  const handleRevoke = async (roleId) => {
    await revokeRole(user.info._id, roleId);
    user.roles = await fetchUserRoles(user.info._id);
    setRefreshRoles(!refreshRoles);
  };

  const handleStatus = async (status) => {
    await onStatusUpdate(user.info._id, status);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>User Details</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
            <Avatar src={user.info.avatarUrl} sx={{ width: 64, height: 64 }}>
              {user.info.displayName?.[0] || "U"}
            </Avatar>
            <div>
              <Typography variant="h6">{user.info.displayName || user.info.email || user.info._id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.info.email || "No email"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {user.info._id}
              </Typography>
            </div>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="success" onClick={() => handleStatus("ACTIVE")}>
              Activate
            </Button>
            <Button variant="contained" color="warning" onClick={() => handleStatus("SUSPENDED")}>
              Suspend
            </Button>
            <Button variant="contained" color="error" onClick={() => handleStatus("BANNED")}>
              Ban
            </Button>
          </Stack>

          <Tabs value={tab} onChange={(_, value) => setTab(value)}>
            <Tab value="overview" label="Overview" />
            <Tab value="roles" label="Roles" />
            <Tab value="wallet" label="Wallet & History" />
            <Tab value="hosts" label="Host / Live" />
          </Tabs>

          {tab === "overview" && <OverviewTab user={user} />}
          {tab === "roles" && (
            <Card>
              <CardContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Roles
                </Typography>
                <Stack spacing={1}>
                  {(user.roles || []).map((role) => (
                    <Stack direction="row" key={role._id} justifyContent="space-between" alignItems="center">
                      <Typography>
                        {role.roleName} ({role.scopeType})
                      </Typography>
                      <IconButton size="small" onClick={() => handleRevoke(role._id)}>
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Stack>
                  ))}
                  {!user.roles?.length && <Typography variant="body2">No roles assigned.</Typography>}
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Role"
                    select
                    value={roleForm.roleName}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, roleName: event.target.value }))}
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Scope"
                    value={roleForm.scopeType}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, scopeType: event.target.value }))}
                  />
                  <Button variant="contained" startIcon={<Shield />} onClick={handleAssignRole}>
                    Assign
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
          {tab === "wallet" && (
            <WalletTab wallet={user.wallet} history={user.walletHistory} payouts={user.payoutRequests} />
          )}
          {tab === "hosts" && <HostTab hostProfile={user.hostProfile} sessions={user.recentSessions} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const OverviewTab = ({ user }) => (
  <Card>
    <CardContent>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} divider={<Divider flexItem orientation="vertical" />}>
        <Stack spacing={1} flex={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Account
          </Typography>
          <Typography>Status: {user.info.status}</Typography>
          <Typography>
            Created: {new Date(user.info.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </Typography>
          <Typography>
            Last Login:{" "}
            {user.info.lastLoginAt
              ? new Date(user.info.lastLoginAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
              : "—"}
          </Typography>
        </Stack>
        <Stack spacing={1} flex={1}>
          <Typography variant="subtitle2" color="text.secondary">
            VIP & Wealth
          </Typography>
          <Typography>VIP Level: {user.info.vipLevel || 0}</Typography>
          <Typography>Wealth Level ID: {user.info.wealthLevelId || "—"}</Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const WalletTab = ({ wallet, history = [], payouts = [] }) => {
  if (!wallet) {
    return <Typography variant="body2">Wallet not found.</Typography>;
  }

  
return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Balances
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <StatCard label="Cash Balance" value={wallet.cashBalance} />
            <StatCard label="Coin Balance" value={wallet.coinBalance} />
            <StatCard label="Lifetime Top-ups" value={wallet.lifetimeTopups} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Recent Wallet Activity
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>{entry.amount}</TableCell>
                  <TableCell>{entry.referenceType || "—"}</TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!history.length && (
                <TableRow>
                  <TableCell colSpan={4}>No transactions logged.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Recent Payout Requests
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payouts.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request._id}</TableCell>
                  <TableCell>{request.amount}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!payouts.length && (
                <TableRow>
                  <TableCell colSpan={4}>No payout history.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
};

const HostTab = ({ hostProfile, sessions = [] }) => (
  <Stack spacing={3}>
    <Card>
      <CardContent>
        <Typography variant="subtitle1">Host Profile</Typography>
        {hostProfile ? (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Typography>Status: {hostProfile.onboardingStatus}</Typography>
            <Typography>Agency ID: {hostProfile.agencyId || "—"}</Typography>
            <Typography>BD Manager ID: {hostProfile.bdManagerId || "—"}</Typography>
            <Typography>Talent Level: {hostProfile.talentLevel || "—"}</Typography>
            <Typography>Lifetime Earnings: {hostProfile.metrics?.lifetimeEarnings || 0}</Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not a host yet.
          </Typography>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Recent Live Sessions
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell>Duration (s)</TableCell>
              <TableCell>Peak Viewers</TableCell>
              <TableCell>Coins Earned</TableCell>
              <TableCell>Started</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{session.sessionCode || session._id}</TableCell>
                <TableCell>{session.durationSeconds}</TableCell>
                <TableCell>{session.peakViewers}</TableCell>
                <TableCell>{session.earnedCoins}</TableCell>
                <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!sessions.length && (
              <TableRow>
                <TableCell colSpan={5}>No live sessions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </Stack>
);

const StatCard = ({ label, value }) => (
  <Card sx={{ flex: 1 }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value ?? 0}</Typography>
    </CardContent>
  </Card>
);

const chipColorForStatus = (status) => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "warning";
    case "BANNED":
      return "error";
    default:
      return "default";
  }
};

export default UsersPage;
