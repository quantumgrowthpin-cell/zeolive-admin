'use client'

import React, { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

// Redux Actions
import { fetchReportReasons } from '@/redux-store/slices/reportReasons'
import { fetchSettings } from '@/redux-store/slices/settings'

// Tab Components
import ReportReasonSettings from './tabs/ReportReasonSettings'
import GeneralSettings from './tabs/GeneralSettings'
import PaymentSettings from './tabs/PaymentSettings'
import AdsSettings from './tabs/AdsSettings'
import ContentModerationSettings from './tabs/ContentModerationSettings'
import WithdrawalSettings from './tabs/WithdrawalSettings'
import ProfileManagement from './tabs/ProfileManageMent'
import GameBetManagement from './tabs/GameBetManagement'

// Tab labels and values
const tabs = [
  { label: 'General', value: 'general' },
  { label: 'Payment', value: 'payment' },

  // { label: 'Ads', value: 'ads' },
  { label: 'Content Moderation', value: 'contentModeration' },
  { label: 'Report Reasons', value: 'reportReasons' },
  { label: 'Withdrawal', value: 'withdrawal' },
  { label: 'Profile Management', value: 'profileManagement' },
  { label: 'Game', value: 'game' }
]

const Settings = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get the tab from URL query param or default to 'general'
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(tabs.some(tab => tab.value === tabParam) ? tabParam : 'general')

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)

    // Update URL with the new tab
    const params = new URLSearchParams(searchParams.toString())

    params.set('tab', newValue)
    router.push(`?${params.toString()}`)
  }

  // Get report reasons data if the tab is 'reportReasons'
  useEffect(() => {
    if (activeTab === 'reportReasons') {
      dispatch(fetchReportReasons())

      return
    }

    // if (activeTab === 'general' || activeTab === 'payment' || activeTab === 'ads') {
    //   dispatch(fetchSettings())
    // }
  }, [activeTab, dispatch])

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'reportReasons':
        return <ReportReasonSettings />
      case 'general':
        return <GeneralSettings />
      case 'payment':
        return <PaymentSettings />

      // case 'ads':
      //   return <AdsSettings />
      case 'contentModeration':
        return <ContentModerationSettings />
      case 'withdrawal':
        return <WithdrawalSettings />
      case 'profileManagement':
        return <ProfileManagement />
      case 'game':
        return <GameBetManagement />
      default:
        return <Typography>Select a tab</Typography>
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label='settings tabs'
                variant='scrollable'
                scrollButtons='auto'
              >
                {tabs.map(tab => (
                  <Tab key={tab.value} label={tab.label} value={tab.value} />
                ))}
              </Tabs>
            </Box>
            <Box>{renderTabContent()}</Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default Settings
