import { Box, Skeleton, Card } from '@mui/material'

const VisitorShimmer = () => {
  return (
    <Box sx={{ width: '100%' }}>
      {[1, 2, 3, 4].map(i => (
        <Card
          key={i}
          sx={{
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme => (theme.palette.mode === 'light' ? 'grey.50' : 'background.paper')
          }}
        >
          <Skeleton variant='circular' width={50} height={50} sx={{ mr: 3 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant='text' width='60%' height={24} sx={{ mb: 1 }} />
            <Skeleton variant='text' width='40%' height={20} />
          </Box>
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <Skeleton variant='circular' width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton variant='text' width={60} />
          </Box>
        </Card>
      ))}
    </Box>
  )
}

export default VisitorShimmer
