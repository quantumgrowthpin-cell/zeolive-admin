/* eslint-disable @next/next/no-img-element */
import React from 'react'

import { Box, Dialog, DialogTitle, Divider, Slide, Typography } from '@mui/material'

import CustomAvatar from '@/@core/components/mui/Avatar'
import { getFullImageUrl } from '@/util/commonfunctions'
import { formatDate } from '@/util/format'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

// Transition
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const DetailItem = ({ icon, label, value }) => (
  <Box display='flex' alignItems='center' gap={1} mb={1}>
    {icon}
    <Typography variant='body2' color='text.primary'>
      <strong>{label}:</strong> {value}
    </Typography>
  </Box>
)

const DummyUserInfoDialog = ({ open, onClose, currentUser, setSelectedUserId }) => {
  console.log(currentUser)

  const handleClose = () => {
    onClose()
    setSelectedUserId(null)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth='xs'
      scroll='body'
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'visible',
          p: 3,
          pt: 5
        }
      }}
    >
      <DialogCloseButton onClick={handleClose}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <Box display='flex' flexDirection='column' alignItems='center' gap={2}>
        <CustomAvatar
          src={currentUser?.image ? getFullImageUrl(currentUser.image) : null}
          alt={currentUser?.name || 'User'}
          size={80}
          sx={{ borderRadius: '50%' }}
        />
        <Typography variant='h6' fontWeight={600}>
          {currentUser?.name}
        </Typography>

        <Divider sx={{ width: '100%', my: 2 }} />

        <Box width='100%' className='flex flex-col gap-y-2'>
          <Typography variant='subtitle1' fontWeight={600} mb={1}>
            Details
          </Typography>

          <div className='flex items-center flex-wrap gap-x-1.5'>
            <i className='tabler-user-circle' />
            <Typography className='font-medium' color='text.primary'>
              Username:
            </Typography>
            <Typography>{currentUser?.userName || '-'}</Typography>
          </div>
          <div className='flex items-center flex-wrap gap-x-1.5'>
            <i className='tabler-id' />
            <Typography className='font-medium' color='text.primary'>
              UniqueId:
            </Typography>
            <Typography>{currentUser?.uniqueId || '-'}</Typography>
          </div>

          <div className='flex items-center flex-wrap gap-x-1.5'>
            <i className='tabler-gender-female' />
            <Typography className='font-medium' color='text.primary'>
              Gender:
            </Typography>
            <Typography>{currentUser?.gender || '-'}</Typography>
          </div>
          <div className='flex items-center flex-wrap gap-x-1.5'>
            <i className='tabler-calendar' />
            <Typography className='font-medium' color='text.primary'>
              Age:
            </Typography>
            <Typography>{currentUser?.age || '-'}</Typography>
          </div>

          <div className='flex items-center flex-wrap gap-x-1.5'>
            <i className='tabler-calendar' />
            <Typography className='font-medium' color='text.primary'>
              Country:
            </Typography>
            <Typography>{currentUser?.country || '-'}</Typography>
          </div>
        </Box>
      </Box>
    </Dialog>
  )
}

export default DummyUserInfoDialog
