'use client'

import React from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'

const GiftCategoriesCardSkeleton = ({ isDarkMode = false }) => {
  // Colors based on theme
  const shimmerBgColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
  const cardBgColor = isDarkMode ? 'rgb(33, 43, 54)' : 'white'
  const footerBgColor = isDarkMode ? 'rgb(26, 34, 43)' : 'rgb(247, 249, 251)'

  // Creating category cards as shown in your latest design
  const renderCategoryCards = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Card
        key={index}
        sx={{
          width: 240,
          borderRadius: 2,
          boxShadow: 2,
          backgroundColor: cardBgColor,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box className="p-4 pb-2 flex justify-between items-start">
          <Box
            sx={{
              height: 24,
              width: 100,
              backgroundColor: shimmerBgColor,
              borderRadius: 1,
              animation: 'pulse 1.5s infinite ease-in-out'
            }}
          />

          <Box className="flex gap-1">
            <Box
              sx={{
                height: 24,
                width: 24,
                backgroundColor: shimmerBgColor,
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            />
            <Box
              sx={{
                height: 24,
                width: 24,
                backgroundColor: shimmerBgColor,
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite ease-in-out',
                animationDelay: '0.2s'
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: footerBgColor,
            p: 3,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8
          }}
        >
          <Box
            sx={{
              height: 16,
              width: 150,
              backgroundColor: shimmerBgColor,
              borderRadius: 0.5,
              animation: 'pulse 1.5s infinite ease-in-out'
            }}
          />
        </Box>
      </Card>
    ))
  }

  return (
    <Box className="p-4">

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          justifyContent: 'flex-start'
        }}
      >
        {renderCategoryCards()}
      </Box>

      {/* CSS for animation */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </Box>
  )
}

export default GiftCategoriesCardSkeleton
