import { useState } from 'react'

import { Typography } from '@mui/material'

const DescriptionCell = ({ description }) => {
  const [readMore, setReadMore] = useState(false)

  if (!description) return <Typography variant='body2'>-</Typography>

  return (
    <div className='text-sm text-gray-700'>
      <Typography
        variant='body2'
        className={`transition-all ${!readMore ? 'line-clamp-3' : ''}`}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          WebkitLineClamp: readMore ? 'unset' : 3 // 👈 3 lines
        }}
      >
        {description}
      </Typography>
      {description.length > 0 && (
        <span onClick={() => setReadMore(!readMore)} className='text-blue-500 cursor-pointer ml-1 text-xs'>
          {readMore ? 'Read Less' : 'Read More'}
        </span>
      )}
    </div>
  )
}

export default DescriptionCell
