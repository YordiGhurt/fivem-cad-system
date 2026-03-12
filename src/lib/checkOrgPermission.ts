import { prisma } from './prisma';
import { OrgPermission } from '@prisma/client';

export async function checkOrgPermission(
  userId: string,
  permissionKey: keyof OrgPermission,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true, rankId: true },
  });

  if (!user) return false;

  // ADMIN bypasses all permission checks
  if (user.role === 'ADMIN') return true;

  // SUPERVISOR bypasses all permission checks
  if (user.role === 'SUPERVISOR') return true;

  if (!user.organizationId) return false;

  const perms = await prisma.orgPermission.findUnique({
    where: { organizationId: user.organizationId },
  });

  if (!perms) return false;

  // Org-level check: permission must be explicitly enabled
  if (!Boolean(perms[permissionKey])) return false;

  // Rank-level check: if the user's rank explicitly disables this permission, deny access
  if (user.rankId) {
    const rank = await prisma.orgRank.findUnique({
      where: { id: user.rankId },
      select: { permissions: true },
    });
    if (rank) {
      const rankPerms = rank.permissions as Record<string, boolean> | null;
      if (rankPerms && rankPerms[permissionKey] === false) return false;
    }
  }

  return true;
}
