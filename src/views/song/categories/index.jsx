'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import { Box, CircularProgress, TablePagination } from '@mui/material'
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Store Imports
import { fetchCategories, deleteCategory, setCategoryPage, setCategoryPageSize } from '@/redux-store/slices/songs'

// Utils
import { getFormattedDateWithoutTime, getFullImageUrl } from '@/util/commonfunctions'

// Dialogs
import CategoryDialog from './CategoryDialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { canEditModule } from '@/util/permissions'

const SongCategories = () => {
  // States
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategory, setEditCategory] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const canEdit = canEditModule("Song Categories");

  // Redux
  const dispatch = useDispatch()

  const { categories, categoryTotal, categoryPage, categoryPageSize, categoryInitialLoading } = useSelector(
    state => state.songs
  )

  const { profileData } = useSelector(state => state.adminSlice)



  // Effects
  useEffect(() => {
    dispatch(
      fetchCategories({
        start: categoryPage,
        limit: categoryPageSize
      })
    )
  }, [dispatch, categoryPage, categoryPageSize])

  // Handlers
  const handleDeleteCategory = async () => {
    if (!categoryToDelete?._id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)
      await dispatch(deleteCategory(categoryToDelete._id)).unwrap()
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to delete category:', error)
      setDeleteError(error.toString())
    } finally {
      setDeleteLoading(false)
    }
  }

  if (categoryInitialLoading) {
    return (
      <div className='flex items-center justify-center gap-2 grow is-full my-10'>
        <CircularProgress />
        <Typography>Loading...</Typography>
      </div>
    )
  }

  return (
    <>
      <Box className='flex flex-col md:flex-row gap-4 justify-between sm:items-center mb-6'>
        <Box>
          <Typography variant='h4' fontWeight={700}>
            Song Categories
          </Typography>
        </Box>
        {canEdit && <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {


            setAddCategoryOpen(true)
          }}
          className=''
        >
          Add Category
        </Button>}
      </Box>
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={categoryPageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              dispatch(setCategoryPageSize(newPageSize))
              dispatch(setCategoryPage(1))
            }}
            className='is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
        </div>

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Category</th>
                <th>Create Time</th>
                <th>Update Time</th>
                {canEdit && <th className='text-center'>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                <>
                  {categories.map(category => (
                    <tr key={category._id}>
                      <td>
                        <CustomAvatar
                          src={getFullImageUrl(category.image)}
                          alt={category.name}
                          variant='rounded'
                          size={40}
                        />
                      </td>
                      <td>
                        <div className='flex items-center gap-4'>
                          <Typography color='text.primary'>{category.name}</Typography>
                        </div>
                      </td>
                      <td>
                        <Typography color='text.primary'>{getFormattedDateWithoutTime(category.createdAt)}</Typography>
                      </td>
                      <td>
                        <Typography color='text.primary'>{getFormattedDateWithoutTime(category.updatedAt)}</Typography>
                      </td>
                      {canEdit && <td>
                        <div className='flex items-center justify-center gap-2'>
                          <IconButton
                            onClick={() => {


                              setEditCategory(category)
                              setAddCategoryOpen(true)
                            }}
                          >
                            <i className='tabler-edit text-textSecondary' />
                          </IconButton>
                          <IconButton
                            onClick={() => {


                              setCategoryToDelete(category)
                              setDeleteConfirmOpen(true)
                              setDeleteError(null)
                            }}
                          >
                            <i className='tabler-trash text-textSecondary' />
                          </IconButton>
                        </div>
                      </td>}
                    </tr>
                  ))}

                  {/* Filler rows to maintain height */}
                  {Array.from({ length: categoryPageSize - categories.length }).map((_, idx) => (
                    <tr key={`filler-${idx}`}>
                      {[...Array(5)].map((_, colIdx) => (
                        <td key={colIdx} className='px-4 py-3'>
                          &nbsp;
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                Array.from({ length: categoryPageSize }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {idx === Math.floor(categoryPageSize / 2) ? (
                      <td colSpan={5} className='text-center py-6 text-gray-500 font-medium whitespace-nowrap'>
                        No categories available
                      </td>
                    ) : (
                      [...Array(5)].map((_, colIdx) => (
                        <td key={colIdx} className='px-4 py-3'>
                          &nbsp;
                        </td>
                      ))
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={categoryPage}
              pageSize={categoryPageSize}
              total={categoryTotal || 0}
              onPageChange={newPage => {
                dispatch(setCategoryPage(newPage))
              }}
            />
          )}
          count={categoryTotal || 0}
          rowsPerPage={categoryPageSize}
          page={categoryPage - 1}
          onPageChange={(_, newPage) => {
            dispatch(setCategoryPage(newPage + 1))
          }}
          onRowsPerPageChange={e => {
            const newPageSize = Number(e.target.value)

            dispatch(setCategoryPageSize(newPageSize))
            dispatch(setCategoryPage(1))
          }}
        />
      </Card>

      <CategoryDialog
        open={addCategoryOpen}
        onClose={() => {
          setAddCategoryOpen(false)
          setEditCategory(null)
        }}
        editData={editCategory}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-category'
        title='Delete Category'
        text={`Are you sure you want to delete the category "${categoryToDelete?.name}"?`}
        onConfirm={handleDeleteCategory}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </>
  )
}

export default SongCategories
