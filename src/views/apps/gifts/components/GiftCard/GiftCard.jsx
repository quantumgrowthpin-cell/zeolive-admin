'use client'

import { useState, useEffect } from 'react'

import { Card, CardMedia, CardContent, Typography, IconButton, Badge, Box, Chip, Fab, Divider } from '@mui/material'

// import { Edit, Delete } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

import { getFullImageUrl } from '@/util/commonfunctions'
import SVGAPlayer from '@/components/SVGAPlayer'
import { canEditModule } from '@/util/permissions'

// Default placeholder for images
const PLACEHOLDER_IMAGE = '/images/placeholders/gift-placeholder.svg'

const GiftCard = ({ gift, onEdit, onDelete }) => {
  const theme = useTheme()
  const createdAt = new Date(gift.createdAt).toLocaleString()
  const [imageError, setImageError] = useState(false)
  const [svgaError, setSvgaError] = useState(false)
  const canEdit = canEditModule("Gifts");

  // Reset error states when gift changes
  useEffect(() => {
    setImageError(false)
    setSvgaError(false)
  }, [gift])

  // Check if image is SVGA format
  const isSVGA =
    gift.image &&
    (gift.image.toLowerCase().endsWith('.svga') ||
      gift.image.includes('svga') ||
      (gift.fileType && gift.fileType.toLowerCase() === 'svga'))

  // Handle SVGA errors
  const handleSvgaError = () => {
    console.error('SVGA failed to load:', gift.image)
    setSvgaError(true)
  }

  return (
    <Box className='relative group'>
      <Card className='transition-all hover:shadow-xl flex flex-col h-full'>
        {/* Coin badge */}
        <Chip
          label={gift.coin}
          icon={<i className='tabler-coin' />}
          color='primary'
          variant='tonal'
          className='absolute top-2 right-2 z-10'
        />

        {/* Title display at the top of the card */}
        <Typography
          variant='subtitle1'
          component='h3'
          className='text-center font-medium px-3 pt-3 pb-2 truncate'
          title={gift.title || ''}
        >
          {gift.title || 'Gift'}
        </Typography>

        <Divider sx={{ mb: 1 }} />

        {/* Render SVGA Player or regular image or placeholder */}
        {isSVGA && !svgaError ? (
          <Box
            sx={{
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              flex: '1 0 auto'
            }}
          >
            <SVGAPlayer url={getFullImageUrl(gift.image)} width={120} height={120} onError={handleSvgaError} />
          </Box>
        ) : (
          <CardMedia
            component='img'
            height='140'
            image={!imageError && gift.image ? getFullImageUrl(gift.image) : PLACEHOLDER_IMAGE}
            alt={gift.title || 'Gift Image'}
            className='object-contain p-5'
            onError={() => setImageError(true)}
            sx={{ flex: '1 0 auto' }}
          />
        )}

        <CardContent className='text-sm text-muted-foreground border-t mt-auto'>
          <div>Created: {createdAt}</div>
        </CardContent>
      </Card>

      {/* Edit/Delete actions overlay */}
      {canEdit && <Box className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-2 bg-black/20 rounded-md'>
        <Fab size='small' aria-label='edit' onClick={onEdit}>
          <i className='tabler-pencil' />
        </Fab>
        <Fab size='small' aria-label='delete' onClick={onDelete}>
          <i className='tabler-trash' />
        </Fab>
      </Box>}
    </Box>
  )
}

export default GiftCard
