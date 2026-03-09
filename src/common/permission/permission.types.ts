export type AccessLevel = 'r' | 'rw' | 'rwd';

export interface PathPermission {
  path: string;
  access: AccessLevel;
}

export function parsePermissions(raw: string): PathPermission[] {
  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is PathPermission =>
        typeof item.path === 'string' && typeof item.access === 'string',
    );
  } catch {
    return [];
  }
}

export function resolveAccess(
  permissions: PathPermission[],
  requestPath: string,
): AccessLevel | null {
  const normalized = requestPath.startsWith('/')
    ? requestPath
    : `/${requestPath}`;

  let matched: PathPermission | null = null;

  for (const perm of permissions) {
    if (perm.path === '*') continue;

    const prefix = perm.path.endsWith('/') ? perm.path : `${perm.path}/`;

    if (normalized === perm.path || normalized.startsWith(prefix)) {
      if (!matched || perm.path.length > matched.path.length) {
        matched = perm;
      }
    }
  }

  if (matched) return matched.access;

  return permissions.find((p) => p.path === '*')?.access ?? null;
}

export const canRead = (access: AccessLevel | null): boolean =>
  access === 'r' || access === 'rw' || access === 'rwd';

export const canWrite = (access: AccessLevel | null): boolean =>
  access === 'rw' || access === 'rwd';

export const canDelete = (access: AccessLevel | null): boolean =>
  access === 'rwd';
