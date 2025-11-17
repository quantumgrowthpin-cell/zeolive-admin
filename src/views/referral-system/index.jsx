'use client'

import React, { useEffect, useState } from 'react'

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  Typography,
  Box
} from '@mui/material'
import { toast } from 'react-toastify'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'

import { fetchReferralSystems, toggleReferralSystem, deleteReferralSystem } from '@/redux-store/slices/referralSystem'
import ReferralDialog from './components/ReferralDialog'
import { formatDate } from '@/util/format'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { canEditModule } from '@/util/permissions'

const ReferralSystem = () => {
  const dispatch = useDispatch()
  const { referralSystems, loading, initialLoading } = useSelector(state => state.referralSystem)
  const { profileData } = useSelector(state => state.adminSlice)



  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState(null)
  const [dialogMode, setDialogMode] = useState('create')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReferral, setDeleteReferral] = useState(null)
  const canEdit = canEditModule("Referral System");

  useEffect(() => {
    dispatch(fetchReferralSystems())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateClick = () => {


    setDialogMode('create')
    setSelectedReferral(null)
    setDialogOpen(true)
  }

  const handleEditClick = referral => {


    setDialogMode('edit')
    setSelectedReferral(referral)
    setDialogOpen(true)
  }

  const handleToggleActive = async referral => {


    try {
      await dispatch(toggleReferralSystem(referral._id)).unwrap()
    } catch (err) {
      console.error('Failed to toggle referral system:', err)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedReferral(null)
  }

  const handleDeleteClick = referral => {


    setDeleteReferral(referral)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {


    try {
      await dispatch(deleteReferralSystem(deleteReferral._id)).unwrap()
      setDeleteDialogOpen(false)
      setDeleteReferral(null)
    } catch (err) {
      console.error('Failed to delete referral:', err)
    }
  }

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false)
    setDeleteReferral(null)
  }

  return (
    <Card>
      <CardHeader
        title='Referral System'
        action={
          canEdit ?
          <Button startIcon={<i className='tabler-plus' />} variant='contained' onClick={handleCreateClick}>
            Add New Referral
          </Button> : null
        }
      />
      <CardContent component={Paper} sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: 'center' }}>Target Referrals</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Reward Coins</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Created At</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>Updated At</TableCell>
                {canEdit && <TableCell sx={{ textAlign: 'center' }}>Status</TableCell>}
                {canEdit && <TableCell sx={{ textAlign: 'center' }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : referralSystems.length === 0 ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableRow key={`empty-${idx}`}>
                    {idx === Math.floor(10 / 2) ? (
                      <TableCell colSpan={6} align='center'>
                        No referral systems found
                      </TableCell>
                    ) : (
                      <TableCell colSpan={6}>&nbsp;</TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                referralSystems.map(referral => (
                  <TableRow key={referral._id}>
                    <TableCell sx={{ textAlign: 'center' }}>{referral.targetReferrals}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{referral.rewardCoins}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatDate(referral.createdAt)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatDate(referral.updatedAt)}</TableCell>
                    {canEdit && <TableCell sx={{ textAlign: 'center' }}>
                      <Switch
                        checked={referral.isActive}
                        onChange={() => handleToggleActive(referral)}
                        disabled={loading}
                      />
                    </TableCell>}
                    {canEdit &&<TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton onClick={() => handleEditClick(referral)} disabled={loading}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(referral)} disabled={loading}>
                          <i className='tabler-trash' />
                        </IconButton>
                      </Box>
                    </TableCell>}
                  </TableRow>
                ))
              )}
              {referralSystems.length < 10 &&
                Array.from({ length: 10 - referralSystems.length }).map((_, idx) => (
                  <TableRow key={`empty-${idx}`}>
                    <TableCell colSpan={6}>&nbsp;</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      <ReferralDialog open={dialogOpen} onClose={handleDialogClose} mode={dialogMode} referral={selectedReferral} />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        title='Delete Referral'
        message='Are you sure you want to delete this referral system? This action cannot be undone.'
      />
    </Card>
  )
}

export default ReferralSystem
