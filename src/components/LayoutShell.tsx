'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import CartDrawer from './CartDrawer'
import WhatsAppFab from './WhatsAppFab'
import { CartProvider } from './CartProvider'

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/adminlogin')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-ink selection:text-paper">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppFab />
      </div>
    </CartProvider>
  )
}

