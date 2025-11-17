"use client";

import { useEffect, useState } from "react";

import dynamic from "next/dynamic";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

import { fetchAdminDashboard, fetchBdmDashboard } from "@/services/v2/analytics";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ReportsPage = () => {
  const [adminData, setAdminData] = useState(null);
  const [bdmData, setBdmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bdmRestricted, setBdmRestricted] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    setBdmRestricted(false);

    try {
      const admin = await fetchAdminDashboard();

      setAdminData(admin);

      try {
        const bdm = await fetchBdmDashboard();

        setBdmData(bdm);
      } catch (err) {
        if (err?.response?.status === 403) {
          setBdmRestricted(true);
          setBdmData(null);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

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
        <Button variant="contained" onClick={loadAnalytics}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h5">Analytics Drills</Typography>
          <Typography variant="body2" color="text.secondary">
            Deep dive into live activity, payouts, signups, and agency performance.
          </Typography>
        </div>
        <Button onClick={loadAnalytics}>Refresh</Button>
      </Stack>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard title="Live Sessions (7d)" series={adminData?.liveTrends} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard title="Payout Requests (7d)" series={adminData?.payoutTrends} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard title="User Signups (7d)" series={adminData?.signupTrends} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricCard title="Host Recruitment (7d)" series={adminData?.hostRecruitmentTrends} />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Revenue by Provider
              </Typography>
              <Stack spacing={1}>
                {(adminData?.revenueByProvider || []).map((entry) => (
                  <Stack
                    direction="row"
                    key={entry.provider}
                    justifyContent="space-between"
                    sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}
                  >
                    <Typography variant="body2">{entry.provider}</Typography>
                    <Typography variant="body2">
                      {entry.amount?.toLocaleString?.("en-US", { style: "currency", currency: "USD" })}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top BDM by Hosts
              </Typography>
              <Stack spacing={1}>
                {(adminData?.topBdmByHosts || []).map((manager) => (
                  <Stack key={manager.managerId} direction="row" justifyContent="space-between">
                    <Typography variant="body2">{manager.displayName || manager.managerId}</Typography>
                    <Typography variant="body2">{manager.hostCount} hosts</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">BDM Dashboard Snapshot</Typography>
              {bdmRestricted ? (
                <Typography variant="body2" color="text.secondary">
                  Your account doesn&apos;t have the BDM role. Promote a user to BDM (or add the role to yourself) to unlock this view.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Live sessions and host count assigned to the logged-in BDM.
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body1">Live Sessions: {bdmData?.liveSessions ?? "--"}</Typography>
                    <Typography variant="body1">Hosts Assigned: {bdmData?.hostCount ?? "--"}</Typography>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Totals</Typography>
              <Stack spacing={1}>
                {Object.entries(adminData?.totals || {}).map(([key, value]) => (
                  <Stack direction="row" justifyContent="space-between" key={key}>
                    <Typography variant="body2">{key}</Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

const MetricCard = ({ title, series = [] }) => {
  if (!series.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            No data available.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    options: {
      chart: { id: title, toolbar: { show: false }, zoom: { enabled: false } },
      xaxis: { categories: series.map((entry) => entry.date) },
      stroke: { curve: "smooth" },
    },
    series: [
      {
        name: title,
        data: series.map((entry) => entry.count || entry.amount || 0),
      },
    ],
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Chart options={chartData.options} series={chartData.series} type="line" height={260} />
      </CardContent>
    </Card>
  );
};

export default ReportsPage;
