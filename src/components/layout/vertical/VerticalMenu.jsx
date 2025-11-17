'use client'

import { useState } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { signOut as firebaseSignOut } from 'firebase/auth'

import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

import { useDispatch, useSelector } from 'react-redux'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { logoutAdmin,logoutSubAdmin } from '@/redux-store/slices/admin'
import { auth } from '@/libs/firebase'
import { canViewModule, hasVisibleItems, isSubAdminUser } from '@/util/permissions'

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }) => {
  // Hooks
  const theme = useTheme()
  const pathname = usePathname()
  const verticalNavOptions = useVerticalNav()
  const dispatch = useDispatch()
  const router = useRouter()
  const { settings } = useSelector(state => state.settings)

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  // Check if current path is user/view or starts with /apps/user
  const isUserPath = pathname === '/user/view' || pathname?.startsWith('/apps/user')

  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleUserLogout = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth)

      // Clear sessionStorage
      sessionStorage.removeItem('uid')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('user')

      // Update Redux store
      dispatch(logoutAdmin())
      dispatch(logoutSubAdmin())

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }


  return (
    <>
      {/* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */}
      <ScrollWrapper
        {...(isBreakpointReached
          ? {
              className: 'bs-full overflow-y-auto overflow-x-hidden',
              onScroll: container => scrollMenu(container, false)
            }
          : {
              options: { wheelPropagation: false, suppressScrollX: true },
              onScrollY: container => scrollMenu(container, true)
            })}
      >
        {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
        {/* Vertical Menu */}
        <Menu
          popoutMenuOffset={{ mainAxis: 23 }}
          menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
          renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
          renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
          menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
        >
          {/* Dashboard */}
          <MenuItem href='/dashboard' icon={<i className='tabler-smart-home' />}>
            Dashboard
          </MenuItem>

          {/* User Management */}
         {hasVisibleItems(["Users", "Host Application", "Host", "Agency", "Coin Trader"]) &&
          <> 
                  <MenuItem disabled>USER MANAGEMENT</MenuItem>
          {canViewModule("Users") && <MenuItem href='/apps/user' icon={<i className='tabler-user' />} exactMatch={false} activeUrl='/apps/user'>
            User
          </MenuItem>}
          {!isSubAdminUser() && <MenuItem href='/sub-admin' icon={<i className='tabler-user-plus' />}>
            Sub Admin
          </MenuItem>}
          {canViewModule("Host Application") && <MenuItem href='/host/application' icon={<i className='tabler-user-scan' />}>
            Host Application
          </MenuItem>}
          {canViewModule("Host") && <MenuItem href='/host/list' icon={<i className='tabler-users-plus' />}>
            Host
          </MenuItem>}
          {canViewModule("Agency") && <MenuItem href='/agency' icon={<i className='tabler-users-group' />} exactMatch={false} activeUrl='/agency'>
            Agency
          </MenuItem>}
          {canViewModule("Coin Trader") && <MenuItem href='/coin-trader' icon={<i className='tabler-database-share' />}>
            Coin Trader
          </MenuItem>} 
          </>
          }

          {/* banner management */}
          {hasVisibleItems(["Splash", "Home", "Gift", "Game"]) &&
            <><MenuItem disabled>BANNER</MenuItem>

         {canViewModule("Splash") && <MenuItem href='/banner/splash' icon={<i className='tabler-picture-in-picture' />}>
            Splash
          </MenuItem>}
          {canViewModule("Home") && <MenuItem href='/banner/home' icon={<i className='tabler-home' />}>
            Home
          </MenuItem>}
          {canViewModule("Gift") && <MenuItem href='/banner/gift' icon={<i className='tabler-gift' />}>
            Gift
          </MenuItem>}
          {canViewModule("Game") && <MenuItem href='/banner/game' icon={<i className='tabler-device-gamepad' />}>
            Game
          </MenuItem>} </>}

          {/* Content Management */}
          {hasVisibleItems(["Social Media Posts", "Social Media Videos", "Song Categories", "Songs", "Hashtags"])  &&
            
            <>
          <MenuItem disabled>CONTENT</MenuItem>
          <SubMenu label='Social Media' icon={<i className='tabler-brand-instagram' />}>
            {canViewModule("Social Media Posts") && <MenuItem href='/social-media/posts'>Posts</MenuItem>}
            {canViewModule("Social Media Videos") && <MenuItem href='/social-media/videos'>Videos</MenuItem>}
          </SubMenu>
          <SubMenu label='Songs' icon={<i className='tabler-music' />}>
            {canViewModule("Song Categories") && <MenuItem href='/songs/categories'>Song Category</MenuItem>}
            {canViewModule("Songs") && <MenuItem href='/songs/list'>Song</MenuItem>}
          </SubMenu>
          {canViewModule("Hashtags") && <MenuItem href='/hashtags' icon={<i className='tabler-hash' />}>
            Hashtag
          </MenuItem>}
          </>
          }

          {/* Engagement & Virtual Items */}
          {hasVisibleItems(["Gift Categories", "Gifts", "Store Rides", "Store Themes", "Store Frames", "Reactions"]) &&
            <>
            <MenuItem disabled>ENGAGEMENT</MenuItem>
          <SubMenu label='Gifts' icon={<i className='tabler-gift' />}>
            {canViewModule("Gift Categories") &&<MenuItem href='/gift-categories'>Gift Category</MenuItem>}
            {canViewModule("Gifts") && <MenuItem href='/gifts'>Gift</MenuItem>}
          </SubMenu>
          <SubMenu label='Store' icon={<i className='tabler-shopping-bag-edit' />}>
            {canViewModule("Store Rides") && <MenuItem href='/store/rides'>Ride</MenuItem>}
            {canViewModule("Store Themes")&& <MenuItem href='/store/themes'>Theme</MenuItem>}
            {canViewModule("Store Frames") && <MenuItem href='/store/frames'>Frame</MenuItem>}
          </SubMenu>
          {canViewModule("Reactions") && <MenuItem href='/reaction' icon={<i className='tabler-mood-happy' />}>
            Reaction
          </MenuItem>} </>}

          {/* Games */}
          {hasVisibleItems(["Game List", "Game History"]) &&
            <>
          <MenuItem disabled>GAME</MenuItem>
          {canViewModule("Game List") && <MenuItem href='/game' icon={<i className='tabler-device-gamepad-2' />}>
            Game List
          </MenuItem>}
          {canViewModule("Game History") && <MenuItem href='/game-history' icon={<i className='tabler-history' />}>
            Game History
          </MenuItem>}
          </>
          }

          {/* CoinTrader */}
          {canViewModule("Coin Plans") && <>
          <MenuItem disabled>PACKAGE</MenuItem>
          <MenuItem href='/coin-plan' icon={<i className='tabler-coins' />}>
            Coin Plan
          </MenuItem>
          </>
          }

          {/* Wealth Level */}
          {canViewModule("Wealth Levels") &&
          <>
          <MenuItem disabled>WEALTH LEVEL</MenuItem>
          <MenuItem href='/wealth-level' icon={<i className='tabler-trending-up' />}>
            Wealth Level
          </MenuItem>
          </>
          }

          {/* Reports & Help */}
         {
          hasVisibleItems(["Help", "Reports"]) &&
          <> 
         
         <MenuItem disabled>SUPPORT & REPORTING</MenuItem>
         {canViewModule("Help") && <MenuItem href='/help' icon={<i className='tabler-help' />}>
            Help
          </MenuItem>}
          {canViewModule("Reports") && <MenuItem href='/reports' icon={<i className='tabler-report' />}>
            Report
          </MenuItem>}
          </>
          }

          {canViewModule("Referral System") &&
          <>
          <MenuItem disabled>REFERRAL SYSTEM</MenuItem>
          <MenuItem href='/referral-system' icon={<i className='tabler-users' />}>
            Referral System
          </MenuItem>
          </>
          }

          {/* Finance */}
          {hasVisibleItems(["Payout Methods", "Payout Request"]) &&
            <>
            <MenuItem disabled>FINANCIAL</MenuItem>
          {/* <MenuItem href='/agency-commission' icon={<i className={`tabler-calculator`} />}>
          Agency Commission
        </MenuItem> */}
          {canViewModule("Payout Methods") && <MenuItem href='/payment-methods' icon={<i className='tabler-credit-card' />}>
            Payout Method
          </MenuItem>}
          {canViewModule("Payout Request") && <MenuItem href='/payout-requests' icon={<i className='tabler-cash-banknote' />}>
            Payout Request
          </MenuItem>}
          </>
          }

          {/* System */}
          <MenuItem disabled>SYSTEM</MenuItem>
         {!isSubAdminUser()  && <MenuItem href='/settings' icon={<i className='tabler-settings' />}>
            Setting
          </MenuItem>}
          <MenuItem href='/profile' icon={<i className='tabler-user-circle' />}>
            Profile
          </MenuItem>
          <MenuItem onClick={() => setConfirmOpen(true)} icon={<i className='tabler-logout' />}>
            Logout
          </MenuItem>
        </Menu>
      </ScrollWrapper>
      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleUserLogout}
        title='Logout'
        content='Are you sure you want to logout?'
        confirmButtonText='Logout'
        cancelButtonText='Cancel'
      />
    </>
  )
}

export default VerticalMenu
