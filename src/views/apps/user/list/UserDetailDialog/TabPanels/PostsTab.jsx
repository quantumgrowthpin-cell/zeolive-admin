'use client'

import React, { useEffect, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
  CircularProgress,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  IconButton,
  Chip,
  Divider,
  useTheme,
  Tooltip,
  Grid,
  Skeleton
} from '@mui/material'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { fetchUserPosts } from '@/redux-store/slices/user'
import UserTabShimmer from '../UserTabShimmer'
import { getFullImageUrl } from '@/util/commonfunctions'

// Post Shimmer Component
const PostShimmer = () => {
  const theme = useTheme()

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Skeleton
        variant='rectangular'
        sx={{
          height: 220,
          backgroundColor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900'
        }}
      />
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Skeleton variant='text' width='30%' sx={{ mb: 1 }} />
        <Skeleton variant='text' sx={{ mb: 0.5 }} />
        <Skeleton variant='text' width='80%' sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' width={80} height={24} sx={{ borderRadius: 1 }} />
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
        <Box display='flex' gap={2}>
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='circular' width={32} height={32} />
        </Box>
        <Skeleton variant='circular' width={32} height={32} />
      </CardActions>
    </Card>
  )
}

const EmptyState = () => {
  const theme = useTheme()

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
      py={8}
      px={2}
      textAlign='center'
    >
      <Box
        sx={{
          borderRadius: '50%',
          p: 2,
          mb: 2
        }}
      >
        <i className='tabler-photo text-3xl' style={{ color: theme.palette.warning.main }} />
      </Box>
      <Typography variant='h6' gutterBottom>
        No Posts Yet
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
        This user hasn&apos;t shared any posts yet.
      </Typography>
    </Box>
  )
}

const PostsTab = ({ userId }) => {
  const dispatch = useDispatch()
  const observerRef = useRef()
  const theme = useTheme()
  const initialFetchRef = useRef(false)
  const totalPostsRef = useRef(0)

  const posts = useSelector(state => state.userReducer.modalData.posts)
  const loadingState = useSelector(state => state.userReducer.modalLoading.posts)
  const { initialLoading, loading, page, reachedEnd } = loadingState

  useEffect(() => {
    if (!initialFetchRef.current && posts.length === 0 && !loading) {
      initialFetchRef.current = true
      dispatch(fetchUserPosts({ userId, start: 1, limit: 8, startDate: 'All', endDate: 'All' }))
    }
  }, [userId, dispatch, loading, posts.length])

  useEffect(() => {
    const setupObserver = () => {
      if (observerRef.current) {
        const currentObserver = observerRef.current

        if (currentObserver && 'disconnect' in currentObserver) {
          currentObserver.disconnect()
        }
      }

      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && !loading && !reachedEnd) {
            const nextStart = posts.length > 0 ? Math.floor(posts.length / 8) + 1 : 1

            dispatch(
              fetchUserPosts({
                userId,
                start: nextStart,
                limit: 8,
                startDate: 'All',
                endDate: 'All'
              })
            )
          }
        },
        { threshold: 0.5, rootMargin: '100px' }
      )

      const loaderElement = document.getElementById('posts-infinite-loader')

      if (loaderElement) {
        observer.observe(loaderElement)
        observerRef.current = observer
      }

      return observer
    }

    const observer = setupObserver()

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [loading, reachedEnd, page, userId, dispatch, posts.length])

  useEffect(() => {
    if (posts.length > 0 && !loading && !initialLoading) {
      const response = posts[0]?._response

      if (response && response.total) {
        totalPostsRef.current = response.total
      }
    }
  }, [posts, loading, initialLoading])

  const getTimeAgo = date => {
    if (!date) return 'Recently'

    try {
      const postDate = new Date(date)
      const now = new Date()
      const diffMs = now - postDate

      const seconds = Math.floor(diffMs / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 30) {
        const months = Math.floor(days / 30)

        return months === 1 ? '1 month ago' : `${months} months ago`
      }

      if (days > 0) {
        return days === 1 ? '1 day ago' : `${days} days ago`
      }

      if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`
      }

      if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
      }

      return 'Just now'
    } catch (error) {
      return 'Recently'
    }
  }

  const loadedPostsCount = posts.length
  const isAllPostsLoaded = totalPostsRef.current > 0 && loadedPostsCount >= totalPostsRef.current

  if (initialLoading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map(index => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <PostShimmer />
          </Grid>
        ))}
      </Grid>
    )
  }

  if (!initialLoading && !loading && posts.length === 0) {
    return <EmptyState />
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={3}>
        {posts.map((post, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={post._id || index}>
            <Card
              variant='outlined'
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                borderRadius: 1,
                overflow: 'hidden',
                ':hover': {
                  boxShadow: theme.shadows[3],
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {post.postImage && post.postImage.length > 0 && (
                <Box sx={{ position: 'relative', height: 220 }}>
                  <Swiper
                    modules={[Navigation, Pagination]}
                    navigation
                    pagination={{ clickable: true }}
                    style={{ height: '100%' }}
                  >
                    {post.postImage.map((image, imageIndex) => (
                      <SwiperSlide key={imageIndex}>
                        <CardMedia
                          component='img'
                          sx={{
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          image={getFullImageUrl(image.url)}
                          alt={`Post image ${imageIndex + 1}`}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
                  {getTimeAgo(post.createdAt)}
                </Typography>

                {post.caption && (
                  <Typography
                    variant='body2'
                    fontWeight={500}
                    sx={{
                      mb: 0.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {post.caption}
                  </Typography>
                )}

                <Box display='flex' gap={1} flexWrap='wrap' mt={1}>
                  {post.postImage && post.postImage.length > 1 && (
                    <Chip
                      icon={<i className='tabler-photo text-base' />}
                      label={`${post.postImage.length} photos`}
                      size='small'
                      color='default'
                      variant='outlined'
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}

                  {post.isFake && (
                    <Chip
                      icon={<i className='tabler-alert-triangle text-base' />}
                      label='Fake Post'
                      size='small'
                      color='error'
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  )}
                </Box>
              </CardContent>

              <Divider />
              <CardActions
                disableSpacing
                sx={{
                  p: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  bgcolor: theme => theme.palette.background.default
                }}
              >
                <Box display='flex'>
                  <Tooltip title='Likes'>
                    <Box display='flex' alignItems='center'>
                      <IconButton
                        aria-label='like'
                        size='small'
                        sx={{
                          color: theme => theme.palette.primary.main,
                          '&:hover': { bgcolor: theme => theme.palette.primary.lighter }
                        }}
                      >
                        <i className='tabler-heart text-lg' />
                      </IconButton>
                      <Typography variant='body2' color='text.primary' className='ml-1'>
                        {post.totalLikes || 0}
                      </Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title='Comments'>
                    <Box display='flex' alignItems='center'>
                      <IconButton
                        aria-label='comment'
                        size='small'
                        className='m-0'
                        sx={{
                          color: theme => theme.palette.info.main,
                          '&:hover': { bgcolor: theme => theme.palette.info.lighter }
                        }}
                      >
                        <i className='tabler-message-circle text-lg' />
                      </IconButton>
                      <Typography variant='body2' color='text.primary' className='ml-1'>
                        {post.totalComments || 0}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
                <Tooltip title='Delete'>
                  <IconButton
                    aria-label='options'
                    size='small'
                    sx={{
                      color: theme => theme.palette.error.main,
                      '&:hover': { bgcolor: theme => theme.palette.error.lighter }
                    }}
                  >
                    <i className='tabler-trash text-lg' />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box
        id='posts-infinite-loader'
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 3,
          mt: 2,
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
          borderRadius: 1
        }}
      >
        {loading && (
          <Box display='flex' alignItems='center' gap={1.5}>
            <CircularProgress size={18} thickness={4} color='primary' />
            <Typography variant='body2' color='text.primary'>
              Loading more posts...
            </Typography>
          </Box>
        )}
        {isAllPostsLoaded && (
          <Typography variant='body2' color='success.main'>
            {loadedPostsCount === 1 ? '1 post loaded' : `All ${loadedPostsCount} posts loaded`}
          </Typography>
        )}
        {!loading && !isAllPostsLoaded && loadedPostsCount > 0 && (
          <Typography variant='body2' color='text.primary'>
            {`${loadedPostsCount} ${totalPostsRef.current > 0 ? `of ${totalPostsRef.current}` : ''} posts loaded`}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default PostsTab
