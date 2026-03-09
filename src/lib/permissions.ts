import { prisma } from './prisma';
import { OrgPermission } from '@prisma/client';

export async function getOrgPermissions(organizationId: string) {
  return prisma.orgPermission.findUnique({
    where: { organizationId },
  });
}

export async function checkPermission(
  organizationId: string | null | undefined,
  permission: keyof OrgPermission,
): Promise<boolean> {
  if (!organizationId) return false;
  const perms = await getOrgPermissions(organizationId);
  if (!perms) return false;
  return Boolean(perms[permission]);
}
