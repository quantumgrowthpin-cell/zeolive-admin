'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Collapse,
  TablePagination
} from '@mui/material'
import { Refresh as RefreshIcon, InfoOutlined as InfoIcon, FilterList as FilterListIcon } from '@mui/icons-material'

import DateRangePicker from '../song/list/DateRangePicker'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { fetchGameRecords, resetGameAdminCoins, setCurrentGameType, GAME_TYPES } from '@/redux-store/slices/gameHistory'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import CustomChip from '@/@core/components/mui/Chip'
import { canEditModule } from '@/util/permissions'

/* -------------------------- helpers -------------------------- */
const GAME_NAME_TO_TYPE = {
  teenpatti: 12,
  casino: 14,
  ferrywheel: 13
}

const GAME_TYPE_TO_NAME = {
  12: 'teenpatti',
  14: 'casino',
  13: 'ferrywheel'
}

/* ========================== component ========================= */
const GameHistory = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const apiCallRef = useRef(null)
  const canEdit = canEditModule("Game History");

  /* ---------- Redux state ---------- */
  const { gameHistories, adminCoin, total, loading } = useSelector(s => s.gameHistory)

  /* ---------- URL-based state initialization ---------- */
  const { initialTab, initialPage, initialLimit } = useMemo(() => {
    const gameParam = searchParams.get('game')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    const tab = gameParam && GAME_NAME_TO_TYPE[gameParam]
      ? GAME_NAME_TO_TYPE[gameParam].toString()
      : GAME_TYPES.TEENPATTI_GAME.toString()

    const page = pageParam ? parseInt(pageParam) : 1
    const limit = limitParam ? parseInt(limitParam) : 10

    return {
      initialTab: tab,
      initialPage: page,
      initialLimit: limit
    }
  }, [searchParams])

  /* ---------- local state ---------- */
  const [activeTab, setActiveTab] = useState(initialTab)
  const [startDate, setStartDate] = useState('All')
  const [endDate, setEndDate] = useState('All')
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [expandedRows, setExpandedRows] = useState({})
  const [confirmReset, setConfirmReset] = useState({ open: false, id: null })

  /* ---------- URL update helper ---------- */
  const updateURL = (newParams) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })

    router.push(`?${params.toString()}`)
  }

  /* ---------- set active tab state ---------- */
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  /* ---------- set page and limit from URL ---------- */
  useEffect(() => {
    if (initialPage !== page) {
      setPage(initialPage)
    }

    if (initialLimit !== limit) {
      setLimit(initialLimit)
    }
  }, [initialPage, initialLimit])

  /* ---------- fetch records with debouncing ---------- */
  useEffect(() => {
    if (activeTab) {
      // Clear any existing timeout
      if (apiCallRef.current) {
        clearTimeout(apiCallRef.current)
      }

      // Set a new timeout to debounce API calls
      apiCallRef.current = setTimeout(() => {
        dispatch(
          fetchGameRecords({
            gameType: parseInt(activeTab),
            startDate,
            endDate,
            start: page,
            limit
          })
        )
      }, 100) // Small delay to prevent multiple calls

      return () => {
        if (apiCallRef.current) {
          clearTimeout(apiCallRef.current)
        }
      }
    }
  }, [dispatch, activeTab, startDate, endDate, page, limit])

  /* ---------- handlers ---------- */
  const changeTab = newValue => {
    const gameName = GAME_TYPE_TO_NAME[parseInt(newValue)]

    // Reset page when changing tabs
    const newPage = 1

    // Update URL with new game and reset page
    updateURL({
      game: gameName,
      page: newPage,
      limit: limit
    })

    setActiveTab(newValue)
    setPage(newPage)
    setExpandedRows({})
  }

  const handleResetCoins = () => {
    setConfirmReset({ open: true, id: null })
  }

  const handlePageChange = newPage => {
    // Update URL with new page
    updateURL({
      game: GAME_TYPE_TO_NAME[parseInt(activeTab)],
      page: newPage,
      limit: limit
    })

    setPage(newPage)
  }

  const handleLimitChange = newLimit => {
    // Reset to page 1 when changing limit
    const newPage = 1

    // Update URL with new limit and reset page
    updateURL({
      game: GAME_TYPE_TO_NAME[parseInt(activeTab)],
      page: newPage,
      limit: newLimit
    })

    setLimit(newLimit)
    setPage(newPage)
  }

  const handleDateChange = (newStartDate, newEndDate) => {
    // Reset page when changing dates
    const newPage = 1

    // Update URL to reset page
    updateURL({
      game: GAME_TYPE_TO_NAME[parseInt(activeTab)],
      page: newPage,
      limit: limit
    })

    setStartDate(newStartDate)
    setEndDate(newEndDate)
    setPage(newPage)
  }

  const handleDateClear = () => {
    // Reset page when clearing dates
    const newPage = 1

    // Update URL to reset page
    updateURL({
      game: GAME_TYPE_TO_NAME[parseInt(activeTab)],
      page: newPage,
      limit: limit
    })

    setStartDate('All')
    setEndDate('All')
    setPage(newPage)
  }

  const handleToggleRow = id => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Custom renderers for different game types
  const renderTeenPattiHistory = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Admin Coin</TableCell>
            <TableCell>Total Bet Coin</TableCell>
            <TableCell>Winner Coin</TableCell>
            <TableCell>Win/Lose</TableCell>

            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Info</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gameHistories.length > 0 ? (
            gameHistories.map((game, index) => {
              const [date, time] = game.date?.split(',') || ['-', '-']
              const netWin = game.winnerCoinMinus - game.totalAdd

              return (
                <React.Fragment key={game._id || index}>
                  <TableRow hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{game.updatedAdminCoin}</TableCell>
                    <TableCell>{game.totalAdd}</TableCell>
                    <TableCell>{game.winnerCoinMinus}</TableCell>
                    <TableCell
                      sx={{
                        color: netWin > 0 ? 'success.main' : 'error.main',
                        fontWeight: 600
                      }}
                    >
                      {Math.abs(netWin)}
                    </TableCell>
                    <TableCell>{date}</TableCell>
                    <TableCell>{time}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleToggleRow(game._id || index)} size='small'>
                        <InfoIcon fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Frame History */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: 0 }}>
                      <Collapse in={expandedRows[game._id || index]} timeout='auto' unmountOnExit>
                        <Box sx={{ px: 4, py: 3 }}>
                          <Typography variant='subtitle1' color='error.main' textAlign='center' gutterBottom>
                            Frame History
                          </Typography>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Select Frame</TableCell>
                                <TableCell>Bit</TableCell>
                                <TableCell>Card</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {game.cardCoin && game.cardCoin.length > 0 ? (
                                game.cardCoin.map((cardInfo, cardIndex) => {
                                  const isWinner = cardInfo.winner

                                  return (
                                    <TableRow key={cardIndex}>
                                      <TableCell
                                        sx={{
                                          color: isWinner ? 'success.main' : 'error.main',
                                          fontWeight: 600
                                        }}
                                      >
                                        {cardIndex + 1}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: isWinner ? 'success.main' : 'error.main',
                                          fontWeight: 600
                                        }}
                                      >
                                        {cardInfo.selectFrame}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: cardInfo.bit > 0 ? 'error.main' : 'success.main',
                                          fontWeight: 600
                                        }}
                                      >
                                        {cardInfo.bit}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: isWinner ? 'success.main' : 'error.main',
                                          fontWeight: 600
                                        }}
                                      >
                                        {cardInfo.card || game.combination?.[cardIndex]?.combination?.[3] || '-'}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} align='center'>
                                    No frame data available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} align='center'>
                Nothing to show!!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderCasinoHistory = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Admin Coin</TableCell>
            <TableCell>Total Bet Coin</TableCell>
            <TableCell>Winner Coin</TableCell>
            <TableCell>Win/Lose</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gameHistories.length > 0 ? (
            gameHistories.map((game, index) => {
              const netWin = game.winnerCoinMinus - game.totalAdd

              return (
                <TableRow key={game._id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{game.updatedAdminCoin || '-'}</TableCell>

                  <TableCell>{game.totalAdd || 0}</TableCell>
                  <TableCell>{game.winnerCoinMinus || 0}</TableCell>
                  <TableCell
                    sx={{
                      color: netWin > 0 ? 'success.main' : 'error.main',
                      fontWeight: 600
                    }}
                  >
                    {Math.abs(netWin)}
                  </TableCell>
                  <TableCell>
                    <CustomChip
                      round='true'
                      color={game.winnerObj?.color || 'primary'}
                      label={game.winnerObj?.no || '-'}
                    />
                  </TableCell>
                  <TableCell>{game.date?.split(' ')[0].replace(',', '') || '-'}</TableCell>
                  <TableCell>{game.date?.split(' ')[1] || '-'}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} align='center'>
                Nothing to show!!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderFerryWheelHistory = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>No</TableCell>
            <TableCell>Admin Coin</TableCell>
            <TableCell>Total Bet Coin</TableCell>
            <TableCell>Winner Coin</TableCell>
            <TableCell>Win/Lose</TableCell>
            <TableCell>Win Frame</TableCell>
            <TableCell>Win X Times</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {gameHistories.length > 0 ? (
            gameHistories.map((game, index) => {
              const netWin = game.winnerCoinMinus - game.totalAdd

              return (
                <TableRow key={game._id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{game.updatedAdminCoin || '-'}</TableCell>

                  <TableCell>{game.totalAdd || 0}</TableCell>
                  <TableCell>{game.winnerCoinMinus || 0}</TableCell>
                  <TableCell
                    sx={{
                      color: netWin > 0 ? 'success.main' : 'error.main',
                      fontWeight: 600
                    }}
                  >
                    {Math.abs(netWin)}
                  </TableCell>
                  <TableCell>{game.winnerNumber || '-'}</TableCell>
                  <TableCell>{game.winnerObj?.multiplier || 1}x</TableCell>
                  <TableCell>{game.date?.split(' ')[0].replace(',', '') || '-'}</TableCell>
                  <TableCell>{game.date?.split(' ')[1] || '-'}</TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={9} align='center'>
                Nothing to show!!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderGameHistory = () => {
    switch (parseInt(activeTab)) {
      case GAME_TYPES.TEENPATTI_GAME:
        return renderTeenPattiHistory()
      case GAME_TYPES.FERRYWHEEL_GAME:
        return renderFerryWheelHistory()
      case GAME_TYPES.CASINO_GAME:
        return renderCasinoHistory()
      default:
        return <Typography>Invalid game type</Typography>
    }
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant='h5'>Game History</Typography>
      </Box>

      <Card>
        {/* <CardContent> */}
        {/* top controls */}
        <Box mb={2} px={6} pt={6} display='flex' justifyContent='space-between' alignItems='center'>
          <Box display='flex' gap={1} mb={3}>
            <Button
              variant={activeTab === GAME_TYPES.TEENPATTI_GAME.toString() ? 'contained' : 'outlined'}
              onClick={() => changeTab(GAME_TYPES.TEENPATTI_GAME.toString())}
            >
              Teen Patti
            </Button>
            <Button
              variant={activeTab === GAME_TYPES.CASINO_GAME.toString() ? 'contained' : 'outlined'}
              onClick={() => changeTab(GAME_TYPES.CASINO_GAME.toString())}
            >
              Roulette Casino
            </Button>
            <Button
              variant={activeTab === GAME_TYPES.FERRYWHEEL_GAME.toString() ? 'contained' : 'outlined'}
              onClick={() => changeTab(GAME_TYPES.FERRYWHEEL_GAME.toString())}
            >
              Ferry Wheel
            </Button>
          </Box>

          <Box display='flex' gap={1} mb={3} flexWrap='wrap' alignItems='center'>
           {canEdit && <Button variant='outlined' startIcon={<RefreshIcon />} onClick={handleResetCoins}>
              Reset Coin
            </Button>}

            <DateRangePicker
              buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
              buttonStartIcon={<FilterListIcon />}
              initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
              initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
              onApply={(s, e) => handleDateChange(s, e)}
              onClear={handleDateClear}
              showClearButton={startDate !== 'All' && endDate !== 'All'}
            />
          </Box>
        </Box>

        <Typography variant='body2' textAlign='right' mb={4} color='error.main' className='pr-6'>
          Admin Total Coin&nbsp;:&nbsp;{adminCoin}
        </Typography>

        {loading ? (
          <Box py={4} display='flex' justifyContent='center'>
            <CircularProgress />
          </Box>
        ) : (
          renderGameHistory()
        )}

        {total > 0 && (
          <Box mt={2}>
            <TablePagination
              component={() => (
                <TablePaginationComponent page={page} pageSize={limit} total={total} onPageChange={handlePageChange} />
              )}
              count={total}
              rowsPerPage={limit}
              page={page - 1}
              onPageChange={(_, newPage) => {
                handlePageChange(newPage + 1)
              }}
              onRowsPerPageChange={e => {
                const newLimit = parseInt(e.target.value)

                handleLimitChange(newLimit)
              }}
            />
          </Box>
        )}
        {/* </CardContent> */}
      </Card>

      <ConfirmationDialog
        open={confirmReset.open}
        setOpen={o => setConfirmReset({ open: o, id: null })}
        type='reset-coin'
        title='Reset Coin'
        description='Are you sure you want to reset the coin?'
        onConfirm={() => {
          dispatch(resetGameAdminCoins())
          setConfirmReset({ open: false, id: null })
        }}
        onClose={() => setConfirmReset({ open: false, id: null })}
      />
    </Box>
  )
}

export default GameHistory
