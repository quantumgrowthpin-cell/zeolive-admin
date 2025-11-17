// MUI Imports
import { useTheme } from '@mui/material/styles'

// Component Imports
import HorizontalNav, { Menu, MenuItem, SubMenu } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { canViewModule, hasVisibleItems, isSubAdminUser } from '@/util/permissions'

const RenderExpandIcon = ({ level }) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = () => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()

  // Vars
  const { transitionDuration } = verticalNavOptions

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        {/* Dashboard */}
        <SubMenu label='Dashboard' icon={<i className='tabler-smart-home' />}>
          <MenuItem href='/dashboard' icon={<i className='tabler-chart-pie-2' />}>
            Main Dashboard
          </MenuItem>
        </SubMenu>

        {/* User Management */}
        {hasVisibleItems(["Users", "Host Application", "Host", "Agency", "Coin Trader"]) &&
          <SubMenu label='User Management' icon={<i className='tabler-users' />}>
          {canViewModule("Users") && <MenuItem href='/apps/user' icon={<i className='tabler-user' />} exactMatch={false} activeUrl='/apps/user'>
            User
          </MenuItem>}
          {!isSubAdminUser() && <MenuItem href='/sub-admin' icon={<i className='tabler-user-plus' />}>
            Sub Admin
          </MenuItem>}
          {hasVisibleItems(["Host", "Host Application"]) && <SubMenu label='Host' icon={<i className='tabler-user-scan' />}>
            <MenuItem href='/host/application'>Applications</MenuItem>
            <MenuItem href='/host/list'>Host List</MenuItem>
          </SubMenu>}
          {canViewModule("Agency") && <MenuItem href='/agency' icon={<i className='tabler-users-group' />} exactMatch={false} activeUrl='/agency'>
            Agency
          </MenuItem>}
          {canViewModule("Coin Trader") && <MenuItem href='/coin-trader' icon={<i className='tabler-database-share' />}>
            Coin Trader
          </MenuItem>}
        </SubMenu>}

        {/* Content Management */}
        {hasVisibleItems(["Social Media Posts", "Social Media Videos", "Song Categories", "Songs", "Hashtags"]) &&
          <SubMenu label='Content Management' icon={<i className='tabler-file-text' />}>
          {hasVisibleItems(["Social Media Posts", "Social Media Videos"]) && <SubMenu label='Social Media' icon={<i className='tabler-brand-instagram' />}>
            {canViewModule("Social Media Posts") && <MenuItem href='/social-media/posts'>Posts</MenuItem>}
            {canViewModule("Social Media Videos") && <MenuItem href='/social-media/videos'>Videos</MenuItem>}
          </SubMenu>}
          {hasVisibleItems(["Song Categories", "Songs"]) && <SubMenu label='Songs' icon={<i className='tabler-music' />}>
            {canViewModule("Song Categories") && <MenuItem href='/songs/categories'>Song Category</MenuItem>}
            {canViewModule("Songs") && <MenuItem href='/songs/list'>Song List</MenuItem>}
          </SubMenu>}
          {canViewModule("Hashtags") && <MenuItem href='/hashtags' icon={<i className='tabler-hash' />}>
            Hashtag
          </MenuItem>}
        </SubMenu>}

        {/* Engagement & Virtual Items */}
        {hasVisibleItems(["Gift Categories", "Gifts", "Store Rides", "Store Themes", "Store Frames", "Reactions"]) && <SubMenu label='Engagement' icon={<i className='tabler-heart' />}>
          {hasVisibleItems(["Gift Categories", "Gifts"]) && <SubMenu label='Gifts' icon={<i className='tabler-gift' />}>
            {canViewModule("Gift Categories") && <MenuItem href='/gift-categories'>Gift Category</MenuItem>}
            {canViewModule("Gifts") && <MenuItem href='/gifts'>Gift Items</MenuItem>}
          </SubMenu>}
          {hasVisibleItems(["Store Rides", "Store Themes", "Store Frames"]) && <SubMenu label='Store' icon={<i className='tabler-shopping-bag-edit' />}>
            {canViewModule("Store Rides") && <MenuItem href='/store/rides'>Ride</MenuItem>}
            {canViewModule("Store Themes") && <MenuItem href='/store/themes'>Theme</MenuItem>}
            {canViewModule("Store Frames") && <MenuItem href='/store/frames'>Frame</MenuItem>}
          </SubMenu>}
         {canViewModule("Reactions") && <MenuItem href='/reaction' icon={<i className='tabler-mood-happy' />}>
            Reaction
          </MenuItem>}
        </SubMenu>}

        {/* Packages */}
        {hasVisibleItems(["Coin Plans"]) && <SubMenu label='Packages' icon={<i className='tabler-package' />}>
          {canViewModule("Coin Plans") && <MenuItem href='/coin-plan' icon={<i className='tabler-coins' />}>
            Coin Plan
          </MenuItem>}
          {/* {canViewModule("Vip Plans") && <MenuItem href='/vip-plan' icon={<i className='tabler-vip' />}>
            VIP Plan
          </MenuItem>} */}
        </SubMenu>}

        {/* Wealth Level */}
        {canViewModule("Wealth Levels") && <SubMenu label='Wealth Management' icon={<i className='tabler-trending-up' />}>
          <MenuItem href='/wealth-level' icon={<i className='tabler-chart-bar' />}>
            Wealth Level
          </MenuItem>
        </SubMenu>}

        {/* Support & Reporting */}
        {hasVisibleItems(["Help", "Reports"]) && <SubMenu label='Support & Reporting' icon={<i className='tabler-help-circle' />}>
         {canViewModule("Help") && <MenuItem href='/help' icon={<i className='tabler-help' />}>
            Help
          </MenuItem>}
         {canViewModule("Reports") && <MenuItem href='/reports' icon={<i className='tabler-report' />}>
            Report
          </MenuItem>}
        </SubMenu>}

        {/* Referral System */}
        {canViewModule("Referral System") && <SubMenu label='Referral System' icon={<i className='tabler-users' />}>
          <MenuItem href='/referral-system' icon={<i className='tabler-users-plus' />}>
            Referral Management
          </MenuItem>
        </SubMenu>}

        {/* Financial */}
        {hasVisibleItems(["Payout Methods", "Payout Request"]) && <SubMenu label='Financial' icon={<i className='tabler-currency-dollar' />}>
          {/* {canViewModule("Agency Commission") && <MenuItem href='/agency-commission' icon={<i className='tabler-calculator' />}>
            Agency Commission
          </MenuItem>} */}
          {canViewModule("Payout Methods") && <MenuItem href='/payment-methods' icon={<i className='tabler-credit-card' />}>
            Payout Method
          </MenuItem>}
          {canViewModule("Payout Request") && <MenuItem href='/payout-requests' icon={<i className='tabler-cash-banknote' />}>
            Payout Request
          </MenuItem>}
        </SubMenu>}

        {/* System */}
        <SubMenu label='System' icon={<i className='tabler-settings' />}>
          {!isSubAdminUser() && <MenuItem href='/settings' icon={<i className='tabler-settings-2' />}>
            Setting
          </MenuItem>}
          <MenuItem href='/profile' icon={<i className='tabler-user-circle' />}>
            Profile
          </MenuItem>
          <MenuItem href='/logout' icon={<i className='tabler-logout' />}>
            Logout
          </MenuItem>
        </SubMenu>
      </Menu>
    </HorizontalNav>
  )
}

export default HorizontalMenu
