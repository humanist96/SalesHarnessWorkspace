import type { Metadata } from 'next'
import { Bricolage_Grotesque, Noto_Sans_KR } from 'next/font/google'
import { cn } from '@/lib/utils'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

const body = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'SalesHarness — AI 영업 자동화',
  description: '코스콤 영업직원의 업무를 AI로 자동화하는 웹 애플리케이션',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={cn(display.variable, body.variable)}>
      <body className="noise-overlay">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
