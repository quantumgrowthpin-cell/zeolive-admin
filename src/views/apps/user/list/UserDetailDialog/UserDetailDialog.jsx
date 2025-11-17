'use client'

import React, { useState, useEffect } from 'react'

import {
  Dialog,
  DialogContent,
  Slide,
  Tab,
  useTheme,
  Typography,
  Box,
  IconButton,
  Divider,
  Stack,
  Chip
} from '@mui/material'
import { TabContext, TabList, TabPanel } from '@mui/lab'

import { useDispatch, useSelector } from 'react-redux'

import FollowersTab from './TabPanels/FollowersTab'
import FollowingTab from './TabPanels/FollowingTab'
import FriendsTab from './TabPanels/FriendsTab'
import PostsTab from './TabPanels/PostsTab'
import VideosTab from './TabPanels/VideosTab'
import VisitorsTab from './TabPanels/VisitorsTab'
import VisitedTab from './TabPanels/VisitedTab'
import BlockedTab from './TabPanels/BlockedTab'
import useDebounce from '@/@core/hooks/useDebounce'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/util/getInitials'

import { resetModalTab } from '@/redux-store/slices/user'
import { getFullImageUrl } from '@/util/commonfunctions'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const TABS = [
  { label: 'Followers', key: 'followers', icon: 'tabler-users-group' },
  { label: 'Following', key: 'following', icon: 'tabler-user-plus' },
  { label: 'Friends', key: 'friends', icon: 'tabler-friends' },
  { label: 'Posts', key: 'posts', icon: 'tabler-photo' },
  { label: 'Videos', key: 'videos', icon: 'tabler-video' },
  { label: 'Visitors', key: 'visitors', icon: 'tabler-eye' },
  { label: 'Visited', key: 'visited', icon: 'tabler-history' },
  { label: 'Blocked', key: 'blocked', icon: 'tabler-ban' }
]

const UserDetailDialog = ({ open, onClose, userId, user = null }) => {
  const [prevUserId, setPrevUserId] = useState(null)
  const [activeTab, setActiveTab] = useState('followers')
  const debouncedTab = useDebounce(activeTab, 300)
  const theme = useTheme()
  const dispatch = useDispatch()

  const actualUserId = userId || (user && user._id)

  const allUsers = useSelector(state => state.userReducer.user || [])
  const currentUser = user || allUsers.find(user => user._id === actualUserId) || {}

  useEffect(() => {
    if (actualUserId && actualUserId !== prevUserId) {
      TABS.forEach(tab => {
        dispatch(resetModalTab(tab.key))
      })
      setActiveTab('followers')
      setPrevUserId(actualUserId)
    }
  }, [dispatch, actualUserId, prevUserId])

  useEffect(() => {
    if (!open && prevUserId) {
      setTimeout(() => {
        TABS.forEach(tab => {
          if (tab.key !== 'videos') {
            dispatch(resetModalTab(tab.key))
          }
        })
        setPrevUserId(null)
      }, 300)
    }
  }, [open, dispatch, prevUserId])

  const handleTabChange = (event, newValue) => setActiveTab(newValue)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth='lg'
      scroll='body'
      PaperProps={{
        sx: {
          minHeight: '80vh',
          borderRadius: 2,
          overflow: 'hidden'
        }
      }}
    >
      <Box
        sx={{
          p: 3,
          pb: 2,
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <CustomAvatar
            src={currentUser.image ? getFullImageUrl(currentUser.image) : null}
            alt={currentUser.name || 'User'}
            size={56}
            sx={{
              border: `2px solid ${theme.palette.primary.main}`,
              boxShadow: theme.shadows[2]
            }}
          >
            {!currentUser.image && getInitials(currentUser.name || 'User')}
          </CustomAvatar>

          <Box>
            <Typography variant='h5' fontWeight={600}>
              {currentUser.name || 'User Details'}
            </Typography>
            <Stack direction='row' spacing={1} mt={0.5}>
              {currentUser.userName && (
                <Typography variant='subtitle2' color='text.secondary'>
                  {currentUser.userName}
                </Typography>
              )}
              {currentUser.uniqueId && (
                <Chip
                  size='small'
                  label={currentUser.uniqueId}
                  color='primary'
                  variant='outlined'
                  sx={{ height: 20 }}
                />
              )}
            </Stack>
          </Box>
        </Box>

        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x' />
        </IconButton>
      </Box>

      <Divider />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          py: 1,
          px: 2,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
        }}
      >
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant='h6' color='primary' fontWeight={600}>
            {currentUser.totalFollowers || 0}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Followers
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant='h6' color='secondary' fontWeight={600}>
            {currentUser.totalFollowings || 0}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Following
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant='h6' color='success.main' fontWeight={600}>
            {currentUser.totalFriends || 0}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Friends
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant='h6' color='warning.main' fontWeight={600}>
            {currentUser.totalPosts || 0}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Posts
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant='h6' color='error.main' fontWeight={600}>
            {currentUser.totalVideos || 0}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Videos
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: 'calc(80vh - 170px)' }}>
        <TabContext value={activeTab}>
          <Box display='flex' height='100%'>
            <TabList
              orientation='vertical'
              onChange={handleTabChange}
              sx={{
                borderRight: 1,
                borderColor: theme.palette.divider,
                minWidth: 130,
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  minHeight: 48
                }
              }}
            >
              {TABS.map(tab => (
                <Tab
                  key={tab.key}
                  label={tab.label}
                  value={tab.key}
                  icon={<i className={`${tab.icon} text-xl`} />}
                  iconPosition='start'
                  sx={{
                    ml: 1,
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      borderRadius: '4px 0 0 4px',
                      backgroundColor:
                        theme.palette.mode === 'light'
                          ? `${theme.palette.primary.light}50`
                          : `${theme.palette.primary.dark}50`,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      '& .MuiTab-iconWrapper': {
                        color: theme.palette.primary.main
                      }
                    }
                  }}
                />
              ))}
            </TabList>

            <Box
              sx={{
                flexGrow: 1,
                px: 3,
                py: 2,
                height: '100%',
                overflowY: 'auto'
              }}
            >
              <TabPanel value='followers' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'followers' && <FollowersTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='following' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'following' && <FollowingTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='friends' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'friends' && <FriendsTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='posts' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'posts' && <PostsTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='videos' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'videos' && <VideosTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='visitors' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'visitors' && <VisitorsTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='visited' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'visited' && <VisitedTab userId={actualUserId} />}
              </TabPanel>
              <TabPanel value='blocked' sx={{ p: 0, height: '100%' }}>
                {debouncedTab === 'blocked' && <BlockedTab userId={actualUserId} />}
              </TabPanel>
            </Box>
          </Box>
        </TabContext>
      </DialogContent>
    </Dialog>
  )
}

export default UserDetailDialog
