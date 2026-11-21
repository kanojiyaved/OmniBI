/**
 * ============================================================================
 * Universal AI Business Intelligence Platform - Authentication & RBAC Engine
 * ============================================================================
 * 
 * Provides enterprise authorization, role-based access control (RBAC),
 * multi-tenant user dataset isolation, and audit trail record generation.
 */

import { UserRole, UserProfile, ActionPermission, DatasetHistoryItem, Dataset } from '../../types';

export const SYSTEM_ROLES_PERMISSIONS: Record<UserRole, ActionPermission[]> = {
  admin: [
    'dataset:upload',
    'dataset:replace',
    'dataset:delete',
    'dataset:clean',
    'dataset:export',
    'ai:query',
    'storage:purge',
    'security:configure',
  ],
  analyst: [
    'dataset:upload',
    'dataset:replace',
    'dataset:clean',
    'dataset:export',
    'ai:query',
  ],
  viewer: [
    'dataset:export',
    'ai:query',
  ],
};

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'usr-admin-1',
    name: 'Platform Administrator',
    email: 'admin@omnibi.enterprise.internal',
    role: 'admin',
    tenantId: 'tenant-default',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-analyst-1',
    name: 'Senior BI Analyst',
    email: 'analyst@omnibi.enterprise.internal',
    role: 'analyst',
    tenantId: 'tenant-default',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-viewer-1',
    name: 'Executive Stakeholder',
    email: 'viewer@omnibi.enterprise.internal',
    role: 'viewer',
    tenantId: 'tenant-default',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Checks if a given role has the requested action permission.
 */
export function hasPermission(role: UserRole, permission: ActionPermission): boolean {
  const allowed = SYSTEM_ROLES_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(permission);
}

/**
 * Checks if the specified user profile is authorized to perform an action.
 */
export function canUserPerform(user: UserProfile | null | undefined, permission: ActionPermission): boolean {
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Asserts authorization; throws an informative Error if access is denied.
 */
export function assertPermission(user: UserProfile | null | undefined, permission: ActionPermission): void {
  if (!canUserPerform(user, permission)) {
    const roleName = user?.role || 'anonymous';
    throw new Error(
      `Access Denied: Role "${roleName}" does not have authorization to perform "${permission}".`
    );
  }
}

/**
 * Enforces data isolation between users and tenants.
 * Filters datasets so users only access records belonging to their tenant/user ID
 * or datasets shared without tenant restriction.
 */
export function filterDatasetsForUser(datasets: Dataset[], user: UserProfile | null | undefined): Dataset[] {
  if (!datasets || datasets.length === 0) return [];
  if (!user) return [];

  return datasets.filter((dataset) => {
    // If dataset has no explicit tenant or matches user's tenant
    if (!dataset.tenantId || dataset.tenantId === user.tenantId) {
      return true;
    }
    return false;
  });
}

/**
 * Creates an immutable dataset audit log history entry.
 */
export function createDatasetHistoryRecord(
  datasetId: string,
  action: DatasetHistoryItem['action'],
  details: string,
  user?: UserProfile
): DatasetHistoryItem {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    datasetId,
    action,
    details,
    timestamp: new Date().toISOString(),
    userId: user?.id,
  };
}
