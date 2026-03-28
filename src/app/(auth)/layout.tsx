import { AuroraBackground } from '@/components/layout/AuroraBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <AuroraBackground />
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
