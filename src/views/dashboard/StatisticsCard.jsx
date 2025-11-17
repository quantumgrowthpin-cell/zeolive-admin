'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import { useSelector } from 'react-redux'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

const StatisticsCard = () => {
  const { metrics } = useSelector(state => state.dashboard)

  const data = [
    {
      stats: metrics.totalUsers || 0,
      title: 'Total Users',
      color: 'primary',
      icon: 'tabler-users'
    },
    {
      stats: metrics.totalVipUsers || 0,
      title: 'VIP Users',
      color: 'info',
      icon: 'tabler-crown'
    },
    {
      stats: metrics.totalReportedUsers || 0,
      title: 'Reported Users',
      color: 'warning',
      icon: 'tabler-alert-triangle'
    },
    {
      stats: metrics.totalBlockedUsers || 0,
      title: 'Blocked Users',
      color: 'secondary',
      icon: 'tabler-ban'
    },
    {
      stats: metrics.totalHosts || 0,
      title: 'Total Hosts',
      color: 'primary',
      icon: 'tabler-user-star'
    },
    {
      stats: metrics.totalBlockedHosts || 0,
      title: 'Blocked Hosts',
      color: 'secondary',
      icon: 'tabler-user-off'
    },
    {
      stats: metrics.totalAgencies || 0,
      title: 'Total Agencies',
      color: 'success',
      icon: 'tabler-building-bank'
    },
    {
      stats: metrics.totalBlockedAgencies || 0,
      title: 'Blocked Agencies',
      color: 'error',
      icon: 'tabler-building-off'
    },
    {
      stats: metrics.totalPosts || 0,
      title: 'Total Posts',
      color: 'error',
      icon: 'tabler-photo'
    },
    {
      stats: metrics.totalVideos || 0,
      title: 'Total Videos',
      color: 'success',
      icon: 'tabler-video'
    },
    {
      stats: metrics.totalReportedPosts || 0,
      title: 'Reported Posts',
      color: 'warning',
      icon: 'tabler-alert-triangle'
    },
    {
      stats: metrics.totalReportedVideos || 0,
      title: 'Reported Videos',
      color: 'warning',
      icon: 'tabler-alert-triangle'
    }
  ]

  return (
    <Card>
      <CardHeader title='Statistics' />
      <CardContent className='flex justify-between flex-wrap gap-4 max-md:pbe-6 max-[1060px]:pbe-[74px] max-[1200px]:pbe-[52px] max-[1320px]:pbe-[74px] max-[1501px]:pbe-[52px]'>
        <Grid container spacing={4} sx={{ inlineSize: '100%' }}>
          {data.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 3 }} className='flex items-center gap-4'>
              <CustomAvatar color={item.color} variant='rounded' size={40} skin='light'>
                <i className={item.icon}></i>
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5'>{item.stats}</Typography>
                <Typography variant='body2' className='text-nowrap'>
                  {item.title}
                </Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
