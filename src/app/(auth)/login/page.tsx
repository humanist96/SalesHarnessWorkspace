'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Mail, Lock, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { login, signup } from '@/lib/auth/actions'

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = isSignup
        ? await signup(email, password, name)
        : await login(email, password)

      if (result.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(result.error || '오류가 발생했습니다.')
      }
    } catch {
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
          <Sparkles className="h-6 w-6 text-amber-950" />
        </div>
        <h1 className="text-[22px] font-bold text-white">SalesHarness</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {isSignup ? '새 계정을 만들어 시작하세요' : 'AI 영업 자동화 플랫폼에 로그인'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px] text-slate-400">이름</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 border-white/[0.06] bg-white/[0.03] pl-10 text-[13px] text-slate-200 placeholder-slate-600"
                required={isSignup}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[13px] text-slate-400">이메일</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="email"
              type="email"
              placeholder="name@koscom.co.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 border-white/[0.06] bg-white/[0.03] pl-10 text-[13px] text-slate-200 placeholder-slate-600"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[13px] text-slate-400">비밀번호</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder={isSignup ? '8자 이상 입력하세요' : '비밀번호를 입력하세요'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 border-white/[0.06] bg-white/[0.03] pl-10 text-[13px] text-slate-200 placeholder-slate-600"
              required
              minLength={isSignup ? 8 : undefined}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="h-10 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
        >
          {isLoading ? (isSignup ? '가입 중...' : '로그인 중...') : (isSignup ? '회원가입' : '로그인')}
        </Button>
      </form>

      <button
        onClick={() => { setIsSignup(!isSignup); setError('') }}
        className="mt-6 block w-full text-center text-[12px] text-slate-500 transition-colors hover:text-amber-400"
      >
        {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
      </button>
    </div>
  )
}
