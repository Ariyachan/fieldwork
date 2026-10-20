export const apiEnabled = import.meta.env.VITE_API_ENABLED === 'true'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiError(
      'The service is unavailable. Please try again.',
      response.status,
    )
  }
  const data = await response.json()
  if (!response.ok) {
    throw new ApiError(
      data.message ||
        data.error?.message ||
        data.error ||
        'Your request could not be saved.',
      response.status,
    )
  }
  return data as T
}
