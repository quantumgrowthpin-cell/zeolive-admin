'use client'

import React from 'react'

import { Box, Typography } from '@mui/material'

import AgencyListTable from './AgencyListTable'

const Agency = () => {
  return (
    <Box className='pbs-6 container'>
      <Box className='flex justify-between items-center flex-wrap gap-4 mbe-6'>
        <Typography variant='h4' className='font-bold'>
          Agencies
        </Typography>
      </Box>
      <AgencyListTable />
    </Box>
  )
}

export default Agency
