import type { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends z.ZodType<any>>(schema: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (values: any) => {
    const result = schema.safeParse(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: Record<string, any> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        }
      }
    }
    return { values: {}, errors }
  }
}
