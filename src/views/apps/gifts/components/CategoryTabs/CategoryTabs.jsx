'use client'

import { Tabs, Tab, Box } from '@mui/material'

const CategoryTabs = ({ categories, selected, onChange }) => {
  return (
    <Box className='mb-6'>
      <Tabs value={selected} onChange={onChange} variant='scrollable' scrollButtons='auto'>
        <Tab label='All Categories' value='all' />
        {categories.map((cat) => (
          <Tab key={cat._id} label={cat.categoryName} value={cat._id} />
        ))}
      </Tabs>
    </Box>
  )
}

export default CategoryTabs
