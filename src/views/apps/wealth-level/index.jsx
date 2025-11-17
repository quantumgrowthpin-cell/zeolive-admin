'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  useTheme,
  IconButton,
  Box,
  Snackbar,
  Alert
} from '@mui/material'
import { toast } from 'react-toastify'

import {
  getAllLevels,
  updateWealthLevelPermissions,
  resetUpdateStatus,
  deleteWealthLevel
} from '@/redux-store/slices/wealthLevels'
import CreateWealthLevelDialog from './CreateWealthLevelDialog'
import Shimmer from './LevelSkeleton'
import { getFullImageUrl } from '@/util/commonfunctions'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { canEditModule } from '@/util/permissions'

const WealthLevels = () => {
  const dispatch = useDispatch()
  const { levels, loading, initialLoading, updateStatus, error } = useSelector(state => state.wealthLevelReducer)
  const { profileData } = useSelector(state => state.adminSlice)


  const theme = useTheme()
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [modifiedPermissions, setModifiedPermissions] = useState({})
  const [updatingLevelId, setUpdatingLevelId] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const canEdit = canEditModule("Wealth Levels");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    dispatch(getAllLevels())
  }, [dispatch])

  useEffect(() => {
    if (levels?.length) {
      const initialModifiedState = {}

      levels.forEach(level => {
        initialModifiedState[level._id] = {
          isModified: false,
          permissions: { ...level.permissions }
        }
      })
      setModifiedPermissions(initialModifiedState)
    }
  }, [levels])

  useEffect(() => {
    if (updateStatus.success) {
      setSnackbar({
        open: true,
        message: 'Permissions updated successfully',
        severity: 'success'
      })

      if (updatingLevelId) {
        setModifiedPermissions(prev => ({
          ...prev,
          [updatingLevelId]: {
            ...prev[updatingLevelId],
            isModified: false
          }
        }))
      }

      setUpdatingLevelId(null)

      setTimeout(() => {
        dispatch(resetUpdateStatus())
      }, 500)
    }

    if (updateStatus.error) {
      setSnackbar({
        open: true,
        message: `Error: ${updateStatus.error?.message || 'Failed to update permissions'}`,
        severity: 'error'
      })

      setUpdatingLevelId(null)

      setTimeout(() => {
        dispatch(resetUpdateStatus())
      }, 500)
    }
  }, [updateStatus, dispatch, updatingLevelId])

  const handleEdit = level => {


    setDialogMode('edit')
    setSelectedLevel(level)
    setOpenDialog(true)
  }

  const handleCreate = () => {


    setDialogMode('create')
    setSelectedLevel(null)
    setOpenDialog(true)
  }

  const handlePermissionChange = (levelId, permissionKey, checked) => {


    setModifiedPermissions(prev => {
      const updatedPermissions = {
        ...prev[levelId].permissions,
        [permissionKey]: checked
      }

      const originalPermissions = levels.find(level => level._id === levelId).permissions

      const isModified = Object.keys(updatedPermissions).some(
        key => updatedPermissions[key] !== originalPermissions[key]
      )

      return {
        ...prev,
        [levelId]: {
          isModified,
          permissions: updatedPermissions
        }
      }
    })
  }

  const handleSaveChanges = levelId => {


    if (!modifiedPermissions[levelId]?.isModified) {
      setSnackbar({
        open: true,
        message: 'No changes to save',
        severity: 'info'
      })

      return
    }

    setUpdatingLevelId(levelId)

    const updatedPermissions = {
      levelId,
      ...modifiedPermissions[levelId].permissions
    }

    dispatch(updateWealthLevelPermissions(updatedPermissions))
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const isLevelUpdating = levelId => {
    return updateStatus.loading && updatingLevelId === levelId
  }

  const handleDeleteClick = id => {


    setDeletingId(id)
    setDeleteDialog(true)
  }

  const confirmDelete = () => {


    if (deletingId) dispatch(deleteWealthLevel(deletingId))
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex justify-between items-center mb-6'>
        <Typography variant='h4' color='text.primary'>
          Wealth Levels
        </Typography>
        {canEdit && <Button variant='contained' onClick={handleCreate}>
          + Create Wealth Level
        </Button>}
      </div>

      {initialLoading ? (
        <Shimmer title='Wealth Levels' />
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {levels.map(level => (
            <Box key={level._id} sx={{ position: 'relative' }}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[1],
                  backgroundColor: theme.palette.background.paper
                }}
              >
                <CardHeader
                  title={
                    <Typography variant='h4' color='text.primary'>
                      {level.levelName}
                    </Typography>
                  }
                  subheader={
                    <Box display='flex' alignItems='center' gap={1} color='text.secondary'>
                      <i className='tabler-coin text-base' />
                      <Typography variant='body2' color='inherit'>
                        {level.coinThreshold.toLocaleString()} coins required
                      </Typography>
                    </Box>
                  }
                  sx={{ color: 'white', pt: 2, pb: 2 }}
                  titleTypographyProps={{ color: 'inherit' }}
                  subheaderTypographyProps={{ color: 'inherit' }}
                />

                <CardContent>
                  <div className='flex justify-center mb-3'>
                    <img src={getFullImageUrl(level.levelImage)} alt={level.levelName} className='h-[140px]' />
                  </div>

                  <Typography variant='subtitle1' className='mb-2' color='text.primary'>
                    Permissions
                  </Typography>
                  <div className='flex flex-col gap-1'>
                    {Object.entries(level.permissions || {}).map(([key, value]) => (
                      <FormControlLabel
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        control={
                          <Checkbox
                            checked={modifiedPermissions[level._id]?.permissions[key] ?? value}
                            onChange={e => handlePermissionChange(level._id, key, e.target.checked)}
                            disabled={isLevelUpdating(level._id)}
                            size='small'
                          />
                        }
                        sx={{ color: theme.palette.text.secondary }}
                      />
                    ))}
                  </div>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      color: theme.palette.primary.contrastText,
                      px: 3,
                      py: 1.5,
                      fontSize: '14px',
                      borderRadius: '16px',
                      fontWeight: 700,
                      zIndex: 1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      letterSpacing: '0.5px',
                      border: `1px solid ${theme.palette.primary.light}`,
                      '&:before': {
                        content: '""',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: theme.palette.common.white,
                        opacity: 0.7,
                        marginRight: 1
                      },
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <span>Level {level.level}</span>
                  </Box>
                </CardContent>

                <CardActions className='px-4 pb-4'>
                  <div className='flex justify-between w-full'>
                    {canEdit && 
                    <>
                    <div>
                      <IconButton onClick={() => handleEdit(level)} disabled={isLevelUpdating(level._id)}>
                        <i className='tabler-edit text-xl' />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteClick(level._id)} disabled={isLevelUpdating(level._id)}>
                        <i className='tabler-trash text-xl' />
                      </IconButton>
                    </div>
                     <Button
                      variant='contained'
                      onClick={() => handleSaveChanges(level._id)}
                      disabled={!modifiedPermissions[level._id]?.isModified || isLevelUpdating(level._id)}
                    >
                      {isLevelUpdating(level._id) ? 'Saving...' : 'Save Changes'}
                    </Button></>}
                  </div>
                </CardActions>
              </Card>
            </Box>
          ))}
        </div>
      )}

      <CreateWealthLevelDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        mode={dialogMode}
        levelData={selectedLevel}
      />

      <ConfirmationDialog
        open={deleteDialog}
        setOpen={setDeleteDialog}
        type='delete-wealth-level'
        onConfirm={confirmDelete}
        loading={loading}
        error={error}
        onClose={() => setDeleteDialog(false)}
      />

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default WealthLevels
