import { Region, RoleType, User, UserRegion, Vehicle, VehicleCategory } from '@prisma/client'

// Re-export RoleType from Prisma to ensure consistency
export { RoleType } from '@prisma/client'

// User with all relations for proper typing
export interface UserWithRelations extends User {
  roles: Array<{ role: RoleType }>
  userRegions: Array<UserRegion & { region: Region }>
  vehicles: Array<Vehicle & { category: VehicleCategory }>
}

// Simplified User with roles only (most common use case)
export interface UserWithRoles extends User {
  roles: Array<{ role: RoleType }>
}

// Telegram authentication data interfaces
export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  auth_date: number
  hash: string
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

// Session context for type safety
export interface SessionContext {
  currentState?: string
  data?: Record<string, unknown>
  step?: number
}

// Authenticated user interface for request context
export interface AuthenticatedUser {
  sub: number
  sessionId: string
  userId: number
  username?: string
  firstName: string
  lastName?: string
  roles: RoleType[]
  iat?: number
  exp?: number
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser
}

// NestJS Application type for Prisma service
export type NestApplication = {
  close(): Promise<void>
}
