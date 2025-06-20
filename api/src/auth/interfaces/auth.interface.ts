export interface JwtPayload {
  sub: number // user.id
  telegramId: string
  roles: string[]
  sessionId: string
  iat?: number
  exp?: number
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface AuthenticatedUser {
  id: number
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  roles: string[]
  isActive: boolean
  isBlocked: boolean
  sessionId: string
}

export interface SessionData {
  sessionId: string
  userId: number
  refreshToken?: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
  currentState?: string
  context?: Record<string, unknown>
  clientType?: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginResponse {
  user: {
    id: number
    telegramId: string
    firstName: string
    lastName?: string
    username?: string
    roles: string[]
    isActive: boolean
    isBlocked: boolean
  }
  tokens: TokenPair
  session: {
    sessionId: string
    expiresAt: Date
  }
}

export interface AuthResult {
  user: AuthenticatedUser
  tokens: TokenPair
  session: {
    sessionId: string
    expiresAt: Date
  }
}
