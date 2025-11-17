import React from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import { Box, CardContent, IconButton, Typography } from '@mui/material'

const TableFilters = () => {
  return (
    <Box className='flex flex-col md:flex-row justify-between items-start gap-4 mb-6'>
      <Box className=''>
        <Typography variant='h4'>Sub Admins</Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage sub admins and their rights
        </Typography>
      </Box>
    </Box>
  )
}

export default TableFilters
