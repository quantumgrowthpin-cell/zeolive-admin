'use client'
import { useEffect } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Redux Imports
import { useSelector, useDispatch } from 'react-redux'

import { fetchSettings } from '@/redux-store/slices/settings'

// Component Imports
import NavToggle from './NavToggle'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import NavSearch from '../shared/search'

const NavbarContent = () => {
  const dispatch = useDispatch()
  const isSubAdmin = typeof window !== 'undefined' && sessionStorage.getItem('isSubAdmin') === 'true';

  useEffect(() => {
    if(!isSubAdmin) dispatch(fetchSettings())
  }, [dispatch])

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <ModeDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
