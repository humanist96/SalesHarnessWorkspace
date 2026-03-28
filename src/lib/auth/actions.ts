'use server'

import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, users } from '@/lib/db'
import { signIn, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function login(email: string, password: string) {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }
}

export async function signup(email: string, password: string, name: string) {
  try {
    // 이메일 중복 확인
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing) {
      return { success: false, error: '이미 등록된 이메일입니다.' }
    }

    // 비밀번호 해시
    const hashedPassword = await hash(password, 12)

    // 유저 생성
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role: 'sales',
    })

    // 자동 로그인
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    return { success: true }
  } catch {
    return { success: false, error: '회원가입에 실패했습니다. 다시 시도해주세요.' }
  }
}

export async function logout() {
  await signOut({ redirect: false })
  redirect('/login')
}
