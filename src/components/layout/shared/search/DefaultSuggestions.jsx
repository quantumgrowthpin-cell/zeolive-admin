// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Util Imports

const defaultSuggestions = [
  {
    sectionLabel: 'User Management',
    items: [
      {
        label: 'Users',
        href: '/apps/user',
        icon: 'tabler-user'
      },
      {
        label: 'Host Application',
        href: '/host/application',
        icon: 'tabler-user-scan'
      },
      {
        label: 'Host List',
        href: '/host/list',
        icon: 'tabler-users-plus'
      },
      {
        label: 'Agency',
        href: '/agency',
        icon: 'tabler-users-group'
      }
    ]
  },
  {
    sectionLabel: 'Social Media',
    items: [
      {
        label: 'Posts',
        href: '/social-media/posts',
        icon: 'tabler-photo'
      },
      {
        label: 'Videos',
        href: '/social-media/videos',
        icon: 'tabler-video'
      },
      {
        label: 'Songs',
        href: '/songs/list',
        icon: 'tabler-music'
      },
      {
        label: 'Hashtags',
        href: '/hashtags',
        icon: 'tabler-hash'
      }
    ]
  },
  {
    sectionLabel: 'Engagement',
    items: [
      {
        label: 'Gifts',
        href: '/gifts',
        icon: 'tabler-gift'
      },
      {
        label: 'Rides',
        href: '/store/rides',
        icon: 'tabler-car'
      },
      {
        label: 'Themes',
        href: '/store/themes',
        icon: 'tabler-palette'
      },
      {
        label: 'Frames',
        href: '/store/frames',
        icon: 'tabler-frame'
      }
    ]
  },
  {
    sectionLabel: 'Packages',
    items: [
      {
        label: 'Coin Plans',
        href: '/coin-plan',
        icon: 'tabler-coins'
      },
      {
        label: 'Coin Trader',
        href: '/coin-trader',
        icon: 'tabler-database-share'
      },
      {
        label: 'Wealth Levels',
        href: '/wealth-level',
        icon: 'tabler-trending-up'
      }
    ]
  },
  {
    sectionLabel: 'Finance',
    items: [
      {
        label: 'Referral System',
        href: '/referral-system',
        icon: 'tabler-users'
      },
      {
        label: 'Payout Methods',
        href: '/payment-methods',
        icon: 'tabler-credit-card'
      }
    ]
  },
  {
    sectionLabel: 'Reports & Help',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: 'tabler-report'
      },
      {
        label: 'Help',
        href: '/help',
        icon: 'tabler-help'
      }
    ]
  },
  {
    sectionLabel: 'System',
    items: [
      {
        label: 'Setting',
        href: '/settings',
        icon: 'tabler-settings'
      },
      {
        label: 'Profile',
        href: '/profile',
        icon: 'tabler-user-circle'
      }
    ]
  }
]

const DefaultSuggestions = ({ setOpen }) => {
  // Hooks
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {defaultSuggestions.map((section, index) => (
        <div
          key={index}
          className='flex flex-col justify-start overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs leading-[1.16667] uppercase text-textDisabled tracking-[0.8px]'>
            {section.sectionLabel}
          </p>
          <ul className='flex flex-col gap-4'>
            {section.items.map((item, i) => (
              <li key={i} className='flex'>
                <Link
                  href={item.href}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <i className={classnames(item.icon, 'flex text-xl')} />}
                  <p className='text-[15px] leading-[1.4667] truncate'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
