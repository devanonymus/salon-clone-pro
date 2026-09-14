export const USER_ROLES = ['OWNER', 'MANAGER', 'OPERATOR'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  username: string;
}
