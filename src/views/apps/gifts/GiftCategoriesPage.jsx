'use client'

import { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { Typography, Button, Box } from '@mui/material'
import { toast } from 'react-toastify'

import CategoryTabs from './components/CategoryTabs/CategoryTabs'
import CategoryPanel from './components/CategoryPanel/CategoryPanel'
import { deleteGift, getAllGifts, fetchGiftsCategories, deleteGiftCategory } from '@/redux-store/slices/gifts'
import GiftDialog from './components/GiftDialog/GiftDialog'
import GiftCategoriesShimmer from './GiftCategoriesShimmer'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import GiftCategoryDialog from '../gift-categories/GiftCategoryDialog'
import { canEditModule } from '@/util/permissions'

const GiftCategoriesPage = () => {
  const dispatch = useDispatch()
  const { gifts, initialLoading, categories } = useSelector(state => state.giftReducer)
  const [selectedTab, setSelectedTab] = useState('all')
  const [isGiftDialogOpen, setGiftDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('add') // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedGift, setSelectedGift] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, giftId: null })

  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [editCategoryData, setEditCategoryData] = useState(null)
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState({ open: false, id: null })
  const [globalAddGiftOpen, setGlobalAddGiftOpen] = useState(false)
  const canEdit = canEditModule("Gifts");

  const { profileData } = useSelector(state => state.adminSlice)

  useEffect(() => {
    dispatch(getAllGifts())
    dispatch(fetchGiftsCategories()) // Fetch all categories, including empty ones
  }, [dispatch])

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const handleAddGift = category => {


    setDialogMode('add')
    setSelectedCategory(category)
    setGiftDialogOpen(true)
  }

  const handleAddGiftGlobal = () => {


    setDialogMode('add')
    setSelectedCategory(null) // No category pre-selected
    setGlobalAddGiftOpen(true)
  }

  const handleEditGift = (gift, category) => {


    setDialogMode('edit')
    setSelectedGift(gift)
    setSelectedCategory(category)
    setGiftDialogOpen(true)
  }

  const visibleCategories = selectedTab === 'all' ? gifts : gifts.filter(cat => cat._id === selectedTab)

  const handleDeleteGift = giftId => {


    setConfirmDelete({ open: true, giftId })
  }

  const confirmDeleteGiftAction = () => {
    if (confirmDelete.giftId) {
      dispatch(deleteGift({ giftId: confirmDelete.giftId._id }))
    }

    setConfirmDelete({ open: false, giftId: null })
  }

  // category actions
  const handleEditCategory = category => {


    setEditCategoryData(category)
    setOpenCategoryDialog(true)
  }

  const handleDeleteCategory = categoryId => {


    setConfirmDeleteCategory({ open: true, id: categoryId })
  }

  const confirmDeleteCategoryAction = () => {
    if (confirmDeleteCategory.id) {
      dispatch(deleteGiftCategory(confirmDeleteCategory.id))
    }

    setConfirmDeleteCategory({ open: false, id: null })
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Box className='flex justify-between items-center mb-4'>
        <div>
          <Typography variant='h4' className='font-bold'>
            Gift Categories
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage your gift categories and items
          </Typography>
        </div>
        {canEdit && <Button variant='contained' startIcon={<i className='tabler-gift' />} onClick={handleAddGiftGlobal}>
          Add New Gift
        </Button>}
      </Box>

      {initialLoading ? (
        <GiftCategoriesShimmer />
      ) : (
        <>
          <CategoryTabs categories={gifts} selected={selectedTab} onChange={handleTabChange} />

          {visibleCategories.map(category => (
            <CategoryPanel
              key={category._id}
              category={category}
              onAddGift={() => handleAddGift(category)}
              onEditGift={gift => handleEditGift(gift, category)}
              onDeleteGift={handleDeleteGift}
              onEditCategory={() => handleEditCategory(category)}
              onDeleteCategory={() => handleDeleteCategory(category._id)}
            />
          ))}

          {/* Show message when no categories are displayed */}
          {visibleCategories.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                mt: 2
              }}
            >
              <i className='tabler-category text-4xl mb-2 text-gray-400' />
              <Typography variant='h6' gutterBottom>
                {selectedTab === 'all' ? 'No gift categories found' : 'This category has no gifts'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
                {selectedTab === 'all'
                  ? 'Create new gift categories or add gifts to existing ones'
                  : 'Click the "Add Gift" button to add your first gift to this category'}
              </Typography>
              {canEdit && <Button variant='outlined' onClick={handleAddGiftGlobal} startIcon={<i className='tabler-gift' />}>
                Add New Gift
              </Button>}
            </Box>
          )}
        </>
      )}

      {/* Regular gift dialog (when adding to a specific category) */}
      <GiftDialog
        open={isGiftDialogOpen}
        onClose={() => {
          setGiftDialogOpen(false)
          setSelectedGift(null)
        }}
        mode={dialogMode}
        giftCategoryId={selectedCategory?._id}
        gift={selectedGift}
      />

      {/* Global gift dialog with category selection */}
      <GiftDialog
        open={globalAddGiftOpen}
        onClose={() => {
          setGlobalAddGiftOpen(false)
        }}
        mode='add'
        allowCategorySelection={true}
        categories={categories}
      />

      <ConfirmationDialog
        open={confirmDelete.open}
        setOpen={val => setConfirmDelete({ open: val, giftId: null })}
        type='delete-gift'
        onConfirm={confirmDeleteGiftAction}
        onClose={() => setConfirmDelete({ open: false, giftId: null })}
      />

      <GiftCategoryDialog
        open={openCategoryDialog}
        onClose={() => setOpenCategoryDialog(false)}
        editData={editCategoryData}
      />

      <ConfirmationDialog
        open={confirmDeleteCategory.open}
        setOpen={val => setConfirmDeleteCategory({ open: val, id: null })}
        type='delete-category'
        onConfirm={confirmDeleteCategoryAction}
        onClose={() => setConfirmDeleteCategory({ open: false, id: null })}
      />
    </div>
  )
}

export default GiftCategoriesPage
