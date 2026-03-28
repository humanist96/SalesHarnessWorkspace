'use server'

import { db, documents } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import type { NewDocument } from '@/lib/db/schema'

export async function saveDocument(data: Omit<NewDocument, 'id' | 'createdAt' | 'updatedAt'>) {
  const [doc] = await db.insert(documents).values(data).returning()
  return doc
}

export async function getDocuments(userId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
}

export async function getDocument(id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1)
  return doc ?? null
}

export async function updateDocument(id: string, data: { content?: string; userFeedback?: 'approved' | 'edited' | 'rejected' }) {
  const [doc] = await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(documents.id, id))
    .returning()
  return doc
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id))
}
