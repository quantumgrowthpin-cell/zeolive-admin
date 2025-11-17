"use client";

import V2AuthGuard from '@/components/v2/V2AuthGuard'
import DashboardOverview from '@/views/dashboard-v2/DashboardOverview'

const V2DashboardPage = () => {
  return (
    <V2AuthGuard>
      <DashboardOverview />
    </V2AuthGuard>
  )
}

export default V2DashboardPage
