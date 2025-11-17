'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import CssBaseline from '@mui/material/CssBaseline'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Container from '@mui/material/Container'
import Chip from '@mui/material/Chip'
import { alpha, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  Activity,
  AlignLeft,
  BarChart3,
  Bell,
  AlertTriangle,
  Building2,
  ChartLine,
  ChartNoAxesGantt,
  ChartPie,
  ClipboardList,
  Coins,
  Gift,
  CreditCard,
  Gamepad2,
  Hash,
  HelpCircle,
  History,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageCircle,
  NotebookPen,
  RadioTower,
  Ribbon,
  Settings,
  Sticker,
  ShoppingBag,
  Sparkles,
  Store,
  UserCog,
  Users,
  Wallet,
  Wallet2
} from 'lucide-react'

import { logoutCurrentSession } from '@/services/v2/auth'

const drawerWidth = 260

const NAV_SECTIONS = [
  {
    label: 'Overview',
    links: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Live Monitor', href: '/live-monitor', icon: Activity }
    ]
  },
  {
    label: 'Operations',
    links: [
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Sub Admins', href: '/sub-admins', icon: UserCog },
      { label: 'Followers', href: '/social', icon: Users },
      { label: 'Hosts', href: '/hosts', icon: RadioTower },
      { label: 'Agencies', href: '/agencies', icon: Building2 },
      { label: 'BDM', href: '/bdm', icon: ClipboardList },
      { label: 'Host Apps', href: '/host-applications', icon: RadioTower }
    ]
  },
  {
    label: 'Economy',
    links: [
      { label: 'Coin Plans', href: '/coin-plans', icon: Coins },
      { label: 'Coin Traders', href: '/coin-traders', icon: ChartNoAxesGantt },
      { label: 'Wealth Levels', href: '/wealth-levels', icon: Ribbon },
      { label: 'Currency', href: '/currency', icon: CreditCard },
      { label: 'Wallet', href: '/wallet', icon: Wallet },
      { label: 'Finance', href: '/finance', icon: Wallet2 },
      { label: 'Payouts', href: '/payouts', icon: ChartPie },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Payout Methods', href: '/payout-methods', icon: ChartLine },
      { label: 'Game Coins', href: '/game-coins', icon: Gamepad2 },
      { label: 'Agency Commission', href: '/agency-commissions', icon: NotebookPen }
    ]
  },
  {
    label: 'Content',
    links: [
      { label: 'Gifts', href: '/gifts', icon: Gift },
      { label: 'Gift History', href: '/gift-history', icon: NotebookPen },
      { label: 'Store', href: '/store-items', icon: ShoppingBag },
      { label: 'Reactions', href: '/reactions', icon: Sticker },
      { label: 'Banners', href: '/banners', icon: Megaphone },
      { label: 'Games', href: '/games', icon: Gamepad2 },
      { label: 'Fake Live', href: '/fake-live', icon: RadioTower },
      { label: 'Hashtags', href: '/hashtags', icon: Hash },
      { label: 'Songs', href: '/songs', icon: MessageCircle },
      { label: 'Feed Preview', href: '/feed-preview', icon: MessageCircle },
      { label: 'Content', href: '/content', icon: Store },
      { label: 'Videos', href: '/videos', icon: AlignLeft },
      { label: 'Moderation', href: '/moderation', icon: ListChecks },
      { label: 'Moderation Alerts', href: '/moderation-alerts', icon: AlertTriangle },
      { label: 'Report Reasons', href: '/report-reasons', icon: NotebookPen },
      { label: 'Blocklist', href: '/blocklist', icon: UserCog }
    ]
  },
  {
    label: 'Engagement',
    links: [
      { label: 'Referrals', href: '/referrals', icon: Sparkles },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Help Center', href: '/help-center', icon: HelpCircle },
      { label: 'History', href: '/history', icon: History },
      { label: 'Settings', href: '/settings', icon: Settings }
    ]
  }
]

const moduleSummary = path => {
  if (!path) return 'Overview of platform health and key metrics.'

  const map = {
    '/dashboard': 'See DAU, spend, payouts, incidents in one glance.',
    '/reports': 'Drill into performance cohorts and export CSV snapshots.',
    '/live-monitor': 'Watch live rooms, PK battles, and host health.',
    '/users': 'Search accounts, reset roles, and audit wallets.',
    '/coin-plans': 'Curate storefront pricing and limited-time boosters.',
    '/coin-traders': 'Track OTC dealers, compliance, and disputes.'
  }

  const key = Object.keys(map).find(route => path.startsWith(route))

  return key ? map[key] : 'Manage every module without leaving this workspace.'
}

const AppShell = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profile, setProfile] = useState(null)

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register')

  useEffect(() => {
    if (isAuthPage) return

    const token = sessionStorage.getItem('v2_access_token')

    if (!token) {
      router.replace('/login')
    } else {
      const stored = sessionStorage.getItem('v2_user')

      if (stored) {
        try {
          setProfile(JSON.parse(stored))
        } catch (err) {
          console.warn('Unable to parse stored user profile', err)
        }
      }
    }
  }, [router, isAuthPage])

  const handleLogout = async () => {
    await logoutCurrentSession()
    router.replace('/login')
  }

  const toggleDrawer = () => setDrawerOpen(prev => !prev)

  const activeItem = useMemo(
    () => NAV_SECTIONS.flatMap(section => section.links).find(link => pathname?.startsWith(link.href)),
    [pathname]
  )

  if (isAuthPage) {
    return <Box sx={{ minHeight: '100dvh', backgroundColor: '#f5f5f7' }}>{children}</Box>
  }

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map(chunk => chunk[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD'

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction='row' spacing={2} alignItems='center'>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 20px 35px rgba(79,70,229,0.35)'
            }}
          >
            <Sparkles size={20} />
          </Box>
          <Stack spacing={0} lineHeight={1.1}>
            <Typography variant='subtitle1' fontWeight={700}>
              ChimaX
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Command Center
            </Typography>
          </Stack>
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {NAV_SECTIONS.map(section => (
          <Box key={section.label} sx={{ px: 2, py: 2 }}>
            <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {section.label}
            </Typography>
            <List dense disablePadding>
              {section.links.map(link => {
                const selected = pathname?.startsWith(link.href)

                return (
                  <ListItem key={link.href} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={link.href}
                      selected={selected}
                      onClick={() => {
                        if (!isDesktop) toggleDrawer()
                      }}
                      sx={{
                        borderRadius: 3,
                        mt: 0.5,
                        px: 1.5,
                        py: 1,
                        color: selected ? '#0f172a' : '#475467',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(99,102,241,0.12)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(99,102,241,0.08)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            backgroundColor: selected ? 'rgba(15,23,42,0.92)' : 'rgba(99,102,241,0.12)',
                            color: selected ? '#fff' : 'rgba(79,70,229,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: selected ? '0 6px 20px rgba(15,23,42,0.4)' : 'none'
                          }}
                        >
                          <link.icon size={18} color='currentColor' />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 600 : 500 }}
                        primary={link.label}
                        sx={{ color: selected ? '#0f172a' : '#475467' }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Divider />
      <Box sx={{ px: 3, py: 3 }}>
        <Box
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            backgroundColor: 'rgba(15,23,42,0.3)',
            p: 2
          }}
        >
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar sx={{ bgcolor: '#111' }}>{initials}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle2'>{profile?.displayName || 'Administrator'}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {profile?.email || 'admin@chimax.app'}
              </Typography>
            </Box>
            <Tooltip title='Sign out'>
              <IconButton size='small' onClick={handleLogout} sx={{ color: '#fff' }}>
                <LogoutRoundedIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  )

  return (
    <>
      <CssBaseline />
      <AppBar
        position='fixed'
        elevation={0}
        color='transparent'
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: '1px solid rgba(17, 24, 39, 0.06)',
          backgroundColor: '#fdfefecc',
          backdropFilter: 'blur(12px)'
        }}
      >
        <Toolbar sx={{ minHeight: 68, px: { xs: 2, md: 4 } }}>
          <Stack direction='row' spacing={1.5} alignItems='center' sx={{ flex: 1 }}>
            {!isDesktop && (
              <IconButton onClick={toggleDrawer}>
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Typography variant='subtitle1' fontWeight={600}>
              ChimaX Command Center
            </Typography>
          </Stack>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{initials}</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : drawerOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              borderRight: '1px solid rgba(15, 23, 42, 0.04)',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component='main'
          sx={{
            flexGrow: 1,
            minHeight: '100dvh',
            backgroundImage:
              'radial-gradient(1000px 500px at 10% 0%, rgba(56,189,248,0.12), transparent), radial-gradient(900px 400px at 100% 100%, rgba(129,140,248,0.12), transparent)',
            backgroundColor: '#f5f5f7',
            ml: { md: `${drawerWidth}px` }
          }}
        >
          <Toolbar sx={{ minHeight: 72 }} />
          <Container maxWidth='xl' sx={{ py: { xs: 3, md: 5 } }}>
            {children}
          </Container>
        </Box>
      </Box>
    </>
  )
}

export default AppShell
