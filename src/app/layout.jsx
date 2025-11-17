import './globals.css'

import AppShell from '@/components/AppShell'
import Providers from '@/components/Providers'

export const metadata = {
  title: 'ChimaX Admin',
  description: 'Management console for ChimaX'
}

const RootLayout = async ({ children }) => {
  return (
    <html lang='en'>
      <body>
        <Providers direction='ltr'>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
