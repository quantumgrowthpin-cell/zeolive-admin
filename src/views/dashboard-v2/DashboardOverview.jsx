'use client'

import { useEffect, useMemo, useState } from 'react'

import Grid from '@mui/material/Grid2'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import { Alert, Box, Button, CircularProgress, List, ListItem, ListItemText, Stack } from '@mui/material'
import { motion } from 'framer-motion'

import { Activity, AlertTriangle, Building2, CreditCard, DollarSign, Gauge, PlayCircle, Radio, Users, Wallet } from 'lucide-react'

import { fetchAdminDashboard } from '@/services/v2/auth'

const ACCENTS = {
  indigo: {
    border: 'rgba(99,102,241,0.35)',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.08))',
    iconBg: 'rgba(99,102,241,0.18)',
    iconColor: '#4338ca'
  },
  sky: {
    border: 'rgba(14,165,233,0.3)',
    gradient: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.08))',
    iconBg: 'rgba(56,189,248,0.2)',
    iconColor: '#0369a1'
  },
  emerald: {
    border: 'rgba(16,185,129,0.3)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(49,196,141,0.08))',
    iconBg: 'rgba(16,185,129,0.18)',
    iconColor: '#047857'
  },
  amber: {
    border: 'rgba(245,158,11,0.35)',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.08))',
    iconBg: 'rgba(251,191,36,0.25)',
    iconColor: '#92400e'
  },
  pink: {
    border: 'rgba(236,72,153,0.3)',
    gradient: 'linear-gradient(135deg, rgba(244,114,182,0.22), rgba(236,72,153,0.08))',
    iconBg: 'rgba(244,114,182,0.2)',
    iconColor: '#be185d'
  },
  cyan: {
    border: 'rgba(6,182,212,0.3)',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.07))',
    iconBg: 'rgba(6,182,212,0.2)',
    iconColor: '#0f766e'
  }
}

const PANEL_STYLES = {
  borderRadius: 3,
  border: '1px solid rgba(15,23,42,0.08)',
  backgroundColor: '#fff',
  boxShadow: '0 20px 45px rgba(15,23,42,0.05)'
}

const METRIC_CONFIG = [
  { key: 'activeUsers', label: 'Active Users', icon: Users, accent: 'indigo' },
  { key: 'dau', label: 'DAU (24h)', icon: Gauge, accent: 'sky' },
  { key: 'activeLiveSessions', label: 'Live Sessions', icon: PlayCircle, accent: 'emerald' },
  { key: 'pendingPayouts', label: 'Pending Payouts', icon: Wallet, accent: 'amber' },
  { key: 'hosts', label: 'Hosts', icon: Radio, accent: 'pink' },
  { key: 'agencies', label: 'Agencies', icon: Building2, accent: 'cyan' },
  { key: 'pendingAgencies', label: 'Pending Agencies', icon: Activity, accent: 'amber' },
  { key: 'revenue24h', label: 'Revenue (24h)', icon: DollarSign, accent: 'indigo' },
  { key: 'payoutBacklogAmount', label: 'Payout Backlog', icon: AlertTriangle, accent: 'pink' },
  { key: 'stalePendingPayments', label: 'Stale Payments', icon: CreditCard, accent: 'cyan' }
]

const MetricCard = ({ label, value, accent = 'indigo', icon: Icon }) => {
  const theme = ACCENTS[accent] || ACCENTS.indigo

  return (
    <Box sx={{ borderRadius: 4, background: theme.gradient, p: 0.6 }}>
      <Box
        sx={{
          borderRadius: 3,
          backgroundColor: '#fff',
          border: '1px solid',
          borderColor: theme.border,
          p: 3,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 15px 35px rgba(15,23,42,0.08)'
        }}
      >
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
          <div>
            <Typography variant='body2' color='text.secondary'>
              {label}
            </Typography>
            <Typography variant='h4' fontWeight={600} sx={{ mt: 1 }}>
              {value?.toLocaleString?.() ?? value ?? '--'}
            </Typography>
          </div>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: theme.iconBg,
              color: theme.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            >
              {Icon ? <Icon size={18} color={theme.iconColor} /> : null}
            </Box>
        </Stack>
      </Box>
    </Box>
  )
}

const TrendList = ({ title, data = [] }) => (
  <Paper elevation={0} sx={{ ...PANEL_STYLES, p: 3, height: '100%' }}>
    <Typography variant='h6' sx={{ mb: 2 }}>
      {title}
    </Typography>
    <List dense>
      {data.map(entry => {
        const secondary =
          entry.count !== undefined
            ? entry.count
            : entry.amount?.toLocaleString?.('en-US', { style: 'currency', currency: 'USD' }) ?? '--'

        return (
          <ListItem key={entry.date ?? entry.provider} disablePadding secondaryAction={<Typography>{secondary}</Typography>}>
            <ListItemText primary={entry.date ?? entry.provider} />
          </ListItem>
        )
      })}
      {!data.length && <Typography variant='body2'>No data</Typography>}
    </List>
  </Paper>
)

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchAdminDashboard()

      setData(result)
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Unable to load dashboard'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const metricEntries = useMemo(() => {
    if (!data?.totals) return []

    return METRIC_CONFIG.map(item => ({
      ...item,
      value: data.totals[item.key]
    }))
  }, [data])

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-bs-[60dvh]'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity='error'
        action={
          <Button color='inherit' size='small' onClick={loadDashboard}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    )
  }

  return (
    <Stack spacing={5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems={{ sm: 'center' }}>
        <Box>
          <Typography variant='h3' fontWeight={600} sx={{ mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            See DAU, spend, payouts, and incidents from the new backend in one glance.
          </Typography>
        </Box>
        <Chip
          label='Powered by backend-v2 APIs'
          size='small'
          sx={{ mt: { xs: 3, sm: 0 }, alignSelf: { xs: 'flex-start', sm: 'center' }, backgroundColor: 'rgba(99,102,241,0.12)', color: '#4338ca' }}
        />
      </Stack>

      <Grid container spacing={3}>
        {metricEntries.map(metric => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <MetricCard label={metric.label} value={metric.value} accent={metric.accent} icon={metric.icon} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ ...PANEL_STYLES, p: 3, height: '100%' }}>
            <Typography variant='h6'>Top BDMs by Hosts</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {data?.topBdmByHosts?.length ? (
                data.topBdmByHosts.map(manager => (
                  <ListItem key={manager.managerId} secondaryAction={<Typography>{manager.hostCount}</Typography>}>
                    <ListItemText primary={manager.displayName || manager.managerId} secondary='Hosts managed' />
                  </ListItem>
                ))
              ) : (
                <Typography variant='body2'>No BDM data available.</Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ ...PANEL_STYLES, p: 3, height: '100%' }}>
            <Typography variant='h6'>Revenue by Provider (7d)</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {data?.revenueByProvider?.length ? (
                data.revenueByProvider.map(entry => (
                  <ListItem key={entry.provider} secondaryAction={<Typography>{entry.amount?.toLocaleString?.('en-US', { style: 'currency', currency: 'USD' })}</Typography>}>
                    <ListItemText primary={entry.provider} />
                  </ListItem>
                ))
              ) : (
                <Typography variant='body2'>No revenue data.</Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrendList title='Live Sessions (7d)' data={data?.liveTrends || []} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrendList title='Payout Requests (7d)' data={data?.payoutTrends || []} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrendList title='New Signups (7d)' data={data?.signupTrends || []} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TrendList title='Host Recruitment (7d)' data={data?.hostRecruitmentTrends || []} />
        </Grid>
      </Grid>
    </Stack>
  )
}

export default DashboardOverview
