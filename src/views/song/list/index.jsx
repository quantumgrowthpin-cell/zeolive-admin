'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { toast } from 'react-toastify'
import FilterListIcon from '@mui/icons-material/FilterList'

// Components
import CustomTextField from '@core/components/mui/TextField'
import SongDialog from './SongDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import DateRangePicker from './DateRangePicker'
import SongDataTable from './SongDataTable'

// Redux
import { fetchSongs, deleteSong, setSongPage, setSongPageSize, setDateRange } from '@/redux-store/slices/songs'
import { canEditModule } from '@/util/permissions'

const SongList = () => {
  const dispatch = useDispatch()

  const { songs, songTotal, songPage, songPageSize, songInitialLoading, startDate, endDate } = useSelector(
    state => state.songs
  )

  const [addSongOpen, setAddSongOpen] = useState(false)
  const [editSong, setEditSong] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [songToDelete, setSongToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const canEdit = canEditModule("Songs");

  const { profileData } = useSelector(state => state.adminSlice)



  // Fetch songs
  useEffect(() => {
    dispatch(
      fetchSongs({
        start: songPage,
        limit: songPageSize,
        startDate,
        endDate
      })
    )
  }, [dispatch, songPage, songPageSize, startDate, endDate])

  const handleEdit = song => {
    setEditSong(song)
    setAddSongOpen(true)
  }

  const handleDelete = song => {
    setSongToDelete(song)
    setDeleteConfirmOpen(true)
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!songToDelete?._id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)
      await dispatch(deleteSong(songToDelete._id)).unwrap()
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to delete song:', error)
      setDeleteError(error.toString())
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Box className='flex justify-between items-center mb-6'>
        <Typography variant='h4' fontWeight={700}>
          Songs
        </Typography>
        <DateRangePicker
          buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
          buttonStartIcon={<FilterListIcon />}
          setAction={setDateRange}
          initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
          initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
          showClearButton={startDate !== 'All' && endDate !== 'All'}
          onClear={() => {
            dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
            dispatch(setSongPage(1))
          }}
        />
      </Box>

      <Box className='flex justify-between items-start flex-row md:items-center mb-4 gap-4'>
        {/* <Box className='flex items-center gap-4'> */}
        <CustomTextField
          select
          value={songPageSize}
          onChange={e => {
            const newSize = Number(e.target.value)

            dispatch(setSongPageSize(newSize))
            dispatch(setSongPage(1))
          }}
          className='is-[70px]'
        >
          <MenuItem value='10'>10</MenuItem>
          <MenuItem value='25'>25</MenuItem>
          <MenuItem value='50'>50</MenuItem>
        </CustomTextField>
        {canEdit && <Button
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => {


            setAddSongOpen(true)
          }}
        >
          Add Song
        </Button>}

        {/* </Box> */}
      </Box>

      <SongDataTable
        data={songs}
        loading={songInitialLoading}
        page={songPage}
        pageSize={songPageSize}
        total={songTotal}
        onPageChange={page => dispatch(setSongPage(page))}
        onPageSizeChange={size => dispatch(setSongPageSize(size))}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SongDialog
        open={addSongOpen}
        onClose={() => {
          setAddSongOpen(false)
          setEditSong(null)
        }}
        editData={editSong}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-song'
        title='Delete Song'
        text={`Are you sure you want to delete the song "${songToDelete?.songTitle}"?`}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </>
  )
}

export default SongList
