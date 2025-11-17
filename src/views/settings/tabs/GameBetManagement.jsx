import React, { useEffect, useState } from 'react'

// MUI Imports
import { Box, Button, Card, CardContent, Divider, Grid, InputAdornment, TextField, Typography } from '@mui/material'

// Redux Imports
import { useSelector, useDispatch } from 'react-redux'

import { updateGameCoin } from '@/redux-store/slices/settings'

// Define the async thunk action for updating game coins

const GameBetManagement = () => {
  const dispatch = useDispatch()
  const { settings } = useSelector(state => state.settings)
  const [isLoading, setIsLoading] = useState(false)

  // Now we allow for up to 5 game coins as per the example
  const [gameCoins, setGameCoins] = useState(['', '', '', '', ''])

  // Populate local state when settings are loaded
  useEffect(() => {
    if (settings?.gameCoin && Array.isArray(settings.gameCoin)) {
      // Convert numbers to strings for the text fields
      const coinsAsStrings = settings.gameCoin.map(coin => String(coin))

      // Make sure we have exactly 5 values (or however many needed)
      const filledArray = [...coinsAsStrings]

      while (filledArray.length < 5) filledArray.push('')

      setGameCoins(filledArray.slice(0, 5))
    }
  }, [settings])

  // Handle input change for each game coin
  const handleGameCoinChange = (index, value) => {
    const updatedCoins = [...gameCoins]

    updatedCoins[index] = value
    setGameCoins(updatedCoins)
  }

  const handleSave = () => {
    // Filter out empty values and convert to numbers
    const coinsToSave = gameCoins.filter(coin => coin.trim() !== '').map(coin => parseInt(coin, 10))

    // Only proceed if we have valid numbers
    if (coinsToSave.some(isNaN)) {
      // Show error or alert - we'll keep it simple here
      console.error('All coin values must be valid numbers')

      return
    }

    if (settings?._id) {
      setIsLoading(true)

      // Dispatch the redux action to update game coins
      dispatch(
        updateGameCoin({
          settingId: settings._id,
          gameCoin: coinsToSave
        })
      )
        .unwrap()
        .then(() => {
          console.log('Game coins updated successfully')
        })
        .catch(error => {
          console.error('Failed to update game coins:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }} className='flex justify-between gap-4 items-start md:items-center md:flex-row flex-col'>
        <Typography variant='h5'>Game Bet Management</Typography>
        <Button variant='contained' color='primary' onClick={handleSave} disabled={isLoading}>
          Save Changes
        </Button>
      </Box>

      {/* <Card> */}
      {/* <CardContent> */}
      <Typography variant='body1' sx={{ mb: 3 }}>
        Configure betting amounts that will be available to players.
      </Typography>

      <Grid container spacing={3}>
        {gameCoins.map((coin, index) => (
          <Grid item xs={12} md={3} key={index}>
            <TextField
              fullWidth
              type='number'
              label={`Bet ${index + 1}`}
              value={coin}
              onChange={e => handleGameCoinChange(index, e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <Typography variant='caption' color='text.secondary'>
                      Coin
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        ))}
      </Grid>
      {/* </CardContent> */}
      {/* </Card> */}
    </Box>
  )
}

export default GameBetManagement
