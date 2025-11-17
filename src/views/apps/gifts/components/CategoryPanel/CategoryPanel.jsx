'use client'

import { Card, CardHeader, CardContent, CardActions, Button, Typography } from '@mui/material'

// import { Add, Edit, Delete, CardGiftcard } from '@mui/icons-material'

import GiftCard from '../GiftCard/GiftCard'
import { canEditModule } from '@/util/permissions';

const CategoryPanel = ({ category, onAddGift, onEditCategory, onDeleteCategory, onEditGift, onDeleteGift }) => {
  const canEdit = canEditModule("Gifts");

  
return (
    <Card className='mb-6'>
      {canEdit &&
      <CardHeader

        // avatar={<CardGiftcard color='primary' />}
        title={<Typography variant='h6'>{category.categoryName}</Typography>}
        subheader={`${category.gifts.length} gift${category.gifts.length !== 1 ? 's' : ''}`}
        action={
          <div className='flex gap-2'>
            <Button size='small' variant='outlined' onClick={onEditCategory} startIcon={<i className='tabler-edit' />}>
              Edit
            </Button>
            <Button
              size='small'
              variant='outlined'
              color='error'
              onClick={onDeleteCategory}
              startIcon={<i className='tabler-trash' />}
            >
              Delete
            </Button>
            <Button size='small' variant='contained' onClick={onAddGift} startIcon={<i className='tabler-plus' />}>
              Add Gift
            </Button>
          </div>
        }
      />}
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {category.gifts.map(gift => (
            <GiftCard key={gift._id} gift={gift} onEdit={() => onEditGift(gift)} onDelete={() => onDeleteGift(gift)} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default CategoryPanel
