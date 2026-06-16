export interface SignupPayload {
  orgName: string
  firstName: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  role: string
  firstName: string
  organizationId?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json() as { data?: T; error?: string; message?: string }
  if (!res.ok) {
    throw new Error(json.message ?? 'Something went wrong.')
  }
  return json.data as T
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem('crm_token')
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
    },
  })
  localStorage.removeItem('crm_token')
  localStorage.removeItem('crm_user')
}
