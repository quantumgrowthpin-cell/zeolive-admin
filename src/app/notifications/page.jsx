"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

import { broadcastNotification } from "@/services/v2/notifications";

const roleOptions = ["ADMIN", "MANAGER", "BDM", "AGENCY", "HOST", "USER"];

const NotificationsPage = () => {
  const [form, setForm] = useState({
    roleName: "HOST",
    title: "",
    body: "",
    data: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.body) {
      setResult({ type: "error", message: "Title and body are required" });
      
return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      let payload = {};

      if (form.data) {
        payload = JSON.parse(form.data);
      }

      const response = await broadcastNotification({
        roleName: form.roleName,
        title: form.title,
        body: form.body,
        data: payload,
      });

      setResult({ type: "success", message: `Delivered to ${response?.delivered ?? 0} devices` });
      setForm((prev) => ({ ...prev, title: "", body: "", data: "" }));
    } catch (err) {
      setResult({ type: "error", message: err?.response?.data?.message || err.message || "Failed to send notification" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h5">Notifications</Typography>
        <Typography variant="body2" color="text.secondary">
          Send broadcast push notifications to specific roles.
        </Typography>
      </div>

      {result && (
        <Alert severity={result.type} onClose={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <TextField select label="Audience Role" name="roleName" value={form.roleName} onChange={handleChange}>
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Title" name="title" value={form.title} onChange={handleChange} />
            <TextField
              label="Message"
              name="body"
              value={form.body}
              onChange={handleChange}
              multiline
              minRows={3}
            />
            <TextField
              label="Custom Data (JSON)"
              name="data"
              value={form.data}
              onChange={handleChange}
              multiline
              minRows={3}
              helperText='Optional JSON payload, e.g. {"type":"PROMO","campaign":"VIP"}'
            />
            <Box>
              <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending..." : "Send Notification"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default NotificationsPage;
