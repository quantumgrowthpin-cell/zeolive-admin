"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getCurrentProfile, updateCurrentProfile } from "@/services/v2/profile";
import { changePassword, logoutCurrentSession } from "@/services/v2/auth";

const ProfilePage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ displayName: "", username: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getCurrentProfile();
      setProfile(data);
      setProfileForm({
        displayName: data?.displayName || "",
        username: data?.username || "",
      });
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message || "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await updateCurrentProfile({
        displayName: profileForm.displayName,
        username: profileForm.username,
      });
      setMessage({ type: "success", text: "Profile updated successfully" });
      await loadProfile();
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message || "Failed to update profile" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setMessage({ type: "error", text: "Please enter your current and new password" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New password confirmation does not match" });
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: "success", text: "Password updated successfully" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || err.message || "Failed to update password" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logoutCurrentSession();
    router.push("/login");
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
      <div>
        <Typography variant="h5">My Profile</Typography>
        <Typography variant="body2" color="text.secondary">
          Update your account details, change your password, or sign out securely.
        </Typography>
      </div>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Display Name"
                value={profileForm.displayName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              />
              <TextField
                label="Username"
                value={profileForm.username}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                helperText="Used for commenting and community features."
              />
              <TextField label="Email" value={profile?.email || ""} disabled />
              <Button variant="contained" onClick={handleProfileSave} disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
              <TextField
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                helperText="Minimum 6 characters."
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
              <Button variant="contained" color="secondary" onClick={handlePasswordSave} disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sign Out
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Logging out will end your admin session on this device.
          </Typography>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ProfilePage;
