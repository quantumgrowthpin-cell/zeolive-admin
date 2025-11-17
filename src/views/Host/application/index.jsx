'use client'
import React, { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch } from 'react-redux'

import { TabContext, TabPanel } from '@mui/lab'
import Grid from '@mui/material/Grid'
import { Tab } from '@mui/material'

import CustomTabList from '@/@core/components/mui/TabList'
import HostApplicationTable from './HostApplicationTable'
import { setStatus, APPLICATION_STATUS, resetState } from '@/redux-store/slices/hostApplication'

const HostApplication = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  const tabFromQuery = searchParams.get('tab')

  const tabToStatusMap = {
    pending: APPLICATION_STATUS.PENDING,
    approved: APPLICATION_STATUS.APPROVED,
    rejected: APPLICATION_STATUS.REJECTED
  }

  const [activeTab, setActiveTab] = useState(
    tabFromQuery && Object.keys(tabToStatusMap).includes(tabFromQuery) ? tabFromQuery : 'pending'
  )

  useEffect(() => {
    dispatch(resetState())

    const currentTab = tabFromQuery && Object.keys(tabToStatusMap).includes(tabFromQuery) ? tabFromQuery : 'pending'

    setActiveTab(currentTab)

    dispatch(setStatus(tabToStatusMap[currentTab]))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromQuery])

  const handleChange = (event, value) => {
    if (value === activeTab) return

    router.push(`?tab=${value}`)
  }

  return (
    <>
      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
              <Tab icon={<i className='tabler-clock' />} value='pending' label='Pending' iconPosition='start' />
              <Tab
                icon={<i className='tabler-circle-check' />}
                value='approved'
                label='Approved'
                iconPosition='start'
              />
              <Tab icon={<i className='tabler-circle-x' />} value='rejected' label='Rejected' iconPosition='start' />
            </CustomTabList>
          </Grid>
          <Grid item xs={12}>
            <TabPanel value={activeTab} className='p-0'>
              <HostApplicationTable />
            </TabPanel>
          </Grid>
        </Grid>
      </TabContext>
    </>
  )
}

export default HostApplication
