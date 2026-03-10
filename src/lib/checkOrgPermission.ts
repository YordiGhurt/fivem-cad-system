import { prisma } from './prisma';
import { OrgPermission } from '@prisma/client';

export async function checkOrgPermission(
  userId: string,
  permissionKey: keyof OrgPermission,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, organizationId: true },
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

  return Boolean(perms[permissionKey]);
}
