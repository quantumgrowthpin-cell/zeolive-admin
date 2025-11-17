// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

const AgencyPaginationComponent = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.ceil(total / pageSize) || 1
  
  // Ensure page is within valid range
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const handlePageChange = (_, newPage) => {
    if (newPage !== page && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage)
    }
  }

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>
        {`Showing ${total === 0 ? 0 : (currentPage - 1) * pageSize + 1} to
          ${Math.min(currentPage * pageSize, total)} of ${total} entries`}
      </Typography>
      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default AgencyPaginationComponent
