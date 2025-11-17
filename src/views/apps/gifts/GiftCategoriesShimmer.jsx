'use client'

import React from 'react'

import { useTheme } from '@mui/material/styles'

const GiftCategorySkeleton = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Theme-safe colors
  const bg = isDark ? 'bg-gray-600' : 'bg-gray-200'
  const card = isDark ? 'bg-gray-800' : 'bg-white'
  const border = isDark ? 'border-gray-600' : 'border-gray-200'
  const coin = isDark ? 'bg-gray-500' : 'bg-gray-300'
  const tabBorder = isDark ? 'border-gray-700' : 'border-gray-200'
  const badgeBg = isDark ? 'bg-indigo-800' : 'bg-indigo-100'

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className={`flex space-x-6 mb-8 border-b ${tabBorder}`}>
        {[1, 2, 3, 4, 5, 6].map(index => (
          <div key={index} className="pb-3">
            <div className={`h-6 w-24 ${bg} rounded-full animate-pulse`} />
          </div>
        ))}
      </div>

      {/* Repeat shimmer for 2 category blocks */}
      {[1, 2].map(section => (
        <div key={section} className={`${card} rounded-lg p-6 mb-6 shadow-md`}>
          {/* Category Header */}
          <div className="flex justify-between items-center mb-6">
            <div className={`h-7 w-28 ${bg} rounded animate-pulse`} />
            <div className="flex space-x-2">
              <div className={`h-9 w-16 ${bg} rounded animate-pulse`} />
              <div className={`h-9 w-16 ${bg} rounded animate-pulse`} />
              <div className={`h-9 w-24 ${bg} rounded animate-pulse`} />
            </div>
          </div>

          {/* Gift Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`relative rounded-lg overflow-hidden border ${border}`}>
                {/* Gift image */}
                <div className={`h-48 ${bg} animate-pulse`} />

                {/* Coin badge */}
                <div className={`absolute top-3 right-3 rounded-full ${badgeBg} flex items-center`}>
                  <div className={`h-6 w-14 ${coin} rounded-full animate-pulse`} />
                </div>

                {/* Creation date */}
                <div className="p-3">
                  <div className={`h-4 w-40 ${bg} rounded animate-pulse`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GiftCategorySkeleton
