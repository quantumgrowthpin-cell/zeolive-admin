'use client'

import { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { Box, Button, Card, IconButton, Typography, useTheme } from '@mui/material'
import { format } from 'date-fns'

import { deleteReaction, getAllReactions } from '@/redux-store/slices/reactions'
import CreateEditReactionDialog from './CreateEditReactionDialog'
import { getFullImageUrl } from '@/util/commonfunctions'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { canEditModule } from '@/util/permissions'

// Shimmer loading component
const ShimmerCard = () => {
  const theme = useTheme()

  return (
    <Card className='relative overflow-hidden' sx={{ p: 3 }}>
      <div className='flex items-center justify-between mb-4'>
        <div className='h-6 w-24 rounded animate-pulse' style={{ backgroundColor: theme.palette.action.hover }}></div>
        <div className='flex gap-2'>
          <div className='h-8 w-8 rounded animate-pulse' style={{ backgroundColor: theme.palette.action.hover }}></div>
          <div className='h-8 w-8 rounded animate-pulse' style={{ backgroundColor: theme.palette.action.hover }}></div>
        </div>
      </div>
      <div
        className='h-[100px] w-[100px] rounded animate-pulse'
        style={{ backgroundColor: theme.palette.action.hover }}
      ></div>
      <div
        className='mt-4 h-4 w-32 rounded animate-pulse'
        style={{ backgroundColor: theme.palette.action.hover }}
      ></div>
    </Card>
  )
}

const Reactions = () => {
  const dispatch = useDispatch()
  const { reactions, initialLoading, loading } = useSelector(state => state.reaction)

  const { profileData } = useSelector(state => state.adminSlice)

const canEdit = canEditModule("Reactions");

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })

  useEffect(() => {
    dispatch(getAllReactions())
  }, [dispatch])

  const handleEdit = reaction => {


    setSelectedReaction(reaction)
    setOpenDialog(true)
  }

  const handleDelete = async id => {


    setConfirmDelete({ open: true, id: id })
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedReaction(null)
  }

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      dispatch(deleteReaction(confirmDelete.id))
    }
  }

  const handleConfirmClose = () => {
    setConfirmDelete({ open: false, id: null })
  }

  return (
    <Box className='p-6'>
      <Box className='flex flex-col md:flex-row justify-between items-center mb-6'>
        <Typography variant='h5'>Reactions</Typography>
        {canEdit && <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {


            setOpenDialog(true)
          }}
        >
          Create Reaction
        </Button>}
      </Box>

      {reactions.length === 0 && !initialLoading ? (
        <Box sx={{ minHeight: '300px' }}>
          <Typography variant='h6' color='text.secondary' align='center'>
            <i className='tabler-emoji-sad text-4xl mb-4' />
            <br />
            No reactions available yet.
            <br />
            {canEdit && <Button
              variant='outlined'
              sx={{ mt: 2 }}
              onClick={() => {


                setOpenDialog(true)
              }}
            >
              Create Reaction
            </Button>}
          </Typography>
        </Box>
      ) : (
        <Box className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {initialLoading
            ? Array(8)
                .fill(null)
                .map((_, index) => <ShimmerCard key={index} />)
            : reactions.map(reaction => (
                <Card key={reaction._id} className='relative' sx={{ p: 3 }}>
                  <Box className='flex justify-between items-start mb-4'>
                    <Typography variant='h6' className='font-medium'>
                      {reaction.title}
                    </Typography>
                    {canEdit && <Box className='flex gap-2'>
                      <IconButton size='small' onClick={() => handleEdit(reaction)} sx={{ color: 'primary.main' }}>
                        <i className='tabler-edit' />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDelete(reaction._id)} sx={{ color: 'error.main' }}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </Box>}
                  </Box>
                  <Box className='w-[100px] h-[100px] rounded overflow-hidden'>
                    <img
                      src={getFullImageUrl(reaction.image)}
                      alt={reaction.title}
                      className='w-full h-full object-cover'
                    />
                  </Box>
                  <Typography variant='caption' className='block mt-4 text-gray-500'>
                    Added on {format(new Date(reaction.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                </Card>
              ))}
        </Box>
      )}

      <CreateEditReactionDialog
        open={openDialog}
        onClose={handleCloseDialog}
        mode={selectedReaction ? 'edit' : 'create'}
        reaction={selectedReaction}
      />

      <ConfirmationDialog
        open={confirmDelete.open}
        onClose={handleConfirmClose}
        type='delete-reaction'
        onConfirm={confirmDeleteAction}
        loading={loading}
      />
    </Box>
  )
}

export default Reactions
