"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { fetchSettings, updateSetting } from "@/services/v2/settings";

const settingGroups = [
  {
    label: "Firebase & Auth",
    description: "Keys leveraged by the mobile app for Firebase Auth and messaging.",
    items: [
      { key: "firebase.projectId", label: "Project ID" },
      { key: "firebase.apiKey", label: "Web API Key" },
      { key: "firebase.messagingSenderId", label: "Messaging Sender ID" },
      { key: "firebase.appId", label: "App ID" },
    ],
  },
  {
    label: "Live & RTC",
    description: "Agora tokens / default channels for live and audio chat.",
    items: [
      { key: "agora.appId", label: "Agora App ID" },
      { key: "agora.certificate", label: "Agora Certificate" },
      { key: "live.defaultRegion", label: "Default Region" },
    ],
  },
  {
    label: "Payments",
    description: "Provider keys that power payouts and wallet top-ups.",
    items: [
      { key: "stripe.publishableKey", label: "Stripe Publishable Key" },
      { key: "stripe.secretKey", label: "Stripe Secret Key" },
      { key: "razorpay.keyId", label: "Razorpay Key ID" },
      { key: "razorpay.keySecret", label: "Razorpay Key Secret" },
    ],
  },
  {
    label: "Branding & Links",
    description: "Values that control app links, CDN buckets, and terms/privacy docs.",
    items: [
      { key: "branding.primaryColor", label: "Primary Color" },
      { key: "links.privacyPolicy", label: "Privacy Policy URL" },
      { key: "links.termsOfUse", label: "Terms of Use URL" },
      { key: "cdn.baseUrl", label: "CDN Base URL" },
    ],
  },
];

const keywordOptions = [
  { id: "1", label: "Nudity & adult content" },
  { id: "2", label: "Hate & offensive signs" },
  { id: "3", label: "Violence" },
  { id: "4", label: "Gore & shocking" },
  { id: "5", label: "Weapons" },
  { id: "6", label: "Smoking & tobacco" },
  { id: "7", label: "Recreational/medical drugs" },
  { id: "8", label: "Gambling" },
  { id: "9", label: "Alcohol" },
  { id: "10", label: "Money & bank notes" },
  { id: "11", label: "Self-harm" },
];

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [workingCopy, setWorkingCopy] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const [moderationForm, setModerationForm] = useState({
    sightengineUser: "",
    sightengineApiSecret: "",
    videoBanned: [],
    postBanned: [],
  });

  const [savingModeration, setSavingModeration] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSettings();

      setSettings(data);
      setWorkingCopy(data);
      setModerationForm({
        sightengineUser: data.sightengineUser || "",
        sightengineApiSecret: data.sightengineApiSecret || "",
        videoBanned: Array.isArray(data.videoBanned) ? data.videoBanned : [],
        postBanned: Array.isArray(data.postBanned) ? data.postBanned : [],
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setWorkingCopy((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    setSavingKey(key);
    setMessage(null);
    setError(null);

    try {
      await updateSetting({ key, value: workingCopy[key] ?? "" });
      setSettings((prev) => ({ ...prev, [key]: workingCopy[key] ?? "" }));
      setMessage(`Updated ${key}`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  const handleModerationFieldChange = (field, value) => {
    setModerationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveModeration = async () => {
    setSavingModeration(true);
    setMessage(null);
    setError(null);

    const payloads = [
      { key: "sightengineUser", value: moderationForm.sightengineUser?.trim() || "" },
      { key: "sightengineApiSecret", value: moderationForm.sightengineApiSecret?.trim() || "" },
      { key: "videoBanned", value: moderationForm.videoBanned || [] },
      { key: "postBanned", value: moderationForm.postBanned || [] },
    ];

    try {
      for (const payload of payloads) {
        await updateSetting(payload);
        setSettings((prev) => ({ ...prev, [payload.key]: payload.value }));
      }

      setMessage("Content moderation settings updated");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to update moderation settings");
    } finally {
      setSavingModeration(false);
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
      <div>
        <Typography variant="h5">System Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Central place to manage provider keys, branding, and integration metadata.
        </Typography>
      </div>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {settingGroups.map((group) => (
        <Card key={group.label}>
          <CardContent>
            <Typography variant="h6">{group.label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {group.description}
            </Typography>
            <Stack spacing={3}>
              {group.items.map((item) => (
                <Stack key={item.key} direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                  <TextField
                    fullWidth
                    label={item.label}
                    value={workingCopy[item.key] ?? ""}
                    onChange={(event) => handleChange(item.key, event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    sx={{ minWidth: 160 }}
                    disabled={savingKey === item.key}
                    onClick={() => handleSave(item.key)}
                  >
                    Save
                  </Button>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
            <div>
              <Typography variant="h6">Content Moderation</Typography>
              <Typography variant="body2" color="text.secondary">
                Configure Sightengine and choose which categories should be blocked automatically.
              </Typography>
            </div>
            <Button variant="contained" onClick={handleSaveModeration} disabled={savingModeration}>
              {savingModeration ? "Saving…" : "Save Changes"}
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ mt: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <TextField
                fullWidth
                label="Sightengine API User"
                value={moderationForm.sightengineUser}
                onChange={(event) => handleModerationFieldChange("sightengineUser", event.target.value)}
              />
              <TextField
                fullWidth
                label="Sightengine API Secret"
                value={moderationForm.sightengineApiSecret}
                onChange={(event) => handleModerationFieldChange("sightengineApiSecret", event.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={keywordOptions}
                getOptionLabel={(option) => option.label}
                value={keywordOptions.filter((option) => (moderationForm.videoBanned || []).includes(option.id))}
                onChange={(_, value) => handleModerationFieldChange("videoBanned", value.map((option) => option.id))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });

                    return <Chip key={key} label={option.label} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Video banned keywords" placeholder="Select keywords" />}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                multiple
                disableCloseOnSelect
                options={keywordOptions}
                getOptionLabel={(option) => option.label}
                value={keywordOptions.filter((option) => (moderationForm.postBanned || []).includes(option.id))}
                onChange={(_, value) => handleModerationFieldChange("postBanned", value.map((option) => option.id))}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });

                    return <Chip key={key} label={option.label} {...tagProps} />;
                  })
                }
                renderInput={(params) => <TextField {...params} label="Post banned keywords" placeholder="Select keywords" />}
                sx={{ flex: 1 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Keywords map to Sightengine’s content categories. Leave empty to disable automated blocking.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default SettingsPage;
